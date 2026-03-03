import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FB_API_VERSION = "v21.0";
const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

interface FacebookLead {
  id: string;
  created_time: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  field_data: Array<{ name: string; values: string[] }>;
}

interface SelectedItem {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  fb_page_id: string;
  fb_page_access_token: string;
  fb_user_access_token: string | null;
  fb_ad_account_id: string | null;
  fb_selected_campaigns: SelectedItem[];
  fb_selected_adsets: SelectedItem[];
}

// Helper: fetch all pages from a paginated Facebook API response
async function fetchAllPages<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      const err = await res.text();
      console.error("FB API error:", err);
      break;
    }
    const json = await res.json();
    if (json.data) items.push(...json.data);
    nextUrl = json.paging?.next || null;
  }
  return items;
}

// Parse lead field_data into structured fields
function parseLeadFields(fieldData: Array<{ name: string; values: string[] }>) {
  let firstName = "";
  let lastName = "";
  let phone = "";
  let email = "";
  let country = "";

  // Log raw field_data for debugging
  console.log("Raw field_data:", JSON.stringify(fieldData));

  for (const field of fieldData) {
    const value = field.values?.[0] || "";
    const name = field.name.toLowerCase().trim();

    // First name variations
    if (
      name === "first_name" || name === "first name" || name === "ad" ||
      name === "nome" || name === "isim" || name === "ad_" ||
      name === "ad soyad" || name === "adınız" || name === "name" ||
      name.includes("first_name") || name.includes("first name")
    ) {
      // "ad soyad" or "name" could be full name
      if (name === "ad soyad" || name === "name") {
        const parts = value.trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      } else {
        firstName = value;
      }
    }
    // Last name variations
    else if (
      name === "last_name" || name === "last name" || name === "soyad" ||
      name === "soyadınız" || name === "surname" || name === "cognome" ||
      name.includes("last_name") || name.includes("last name")
    ) {
      lastName = value;
    }
    // Full name variations
    else if (
      name === "full_name" || name === "full name" || name === "ad_soyad" ||
      name === "tam ad" || name === "tam_ad" || name === "fullname" ||
      name === "imię_i_nazwisko" || name === "nombre_completo" || name === "vollständiger_name" ||
      name === "nome_completo" || name === "nom_complet" ||
      name.includes("full_name") || name.includes("full name")
    ) {
      const parts = value.trim().split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    }
    // Phone variations
    else if (
      name === "phone_number" || name === "phone" || name === "telefon" ||
      name === "tel" || name === "telefon_numarası" || name === "cep_telefonu" ||
      name === "mobile" || name === "cellphone" ||
      name === "numer_telefonu" || name === "número_de_teléfono" || name === "telefonnummer" ||
      name === "номер_телефона" ||
      name.includes("phone") || name.includes("telefon") || name.includes("tel_")
    ) {
      phone = value;
    }
    // Email variations
    else if (
      name === "email" || name === "e-posta" || name === "eposta" ||
      name === "mail" || name === "e_posta" || name === "e-mail" ||
      name === "adres_e-mail" || name === "correo_electrónico" || name === "e-mail-adresse" ||
      name === "эл._адрес" || name === "электронная_почта" ||
      name.includes("email") || name.includes("e-posta") || name.includes("mail")
    ) {
      email = value;
    }
    // Country variations
    else if (
      name === "country" || name === "ülke" || name === "ulke" ||
      name.includes("country") || name.includes("ülke")
    ) {
      country = value;
    }
    // Log unrecognized fields
    else {
      console.log(`Unrecognized lead field: "${field.name}" = "${value}"`);
    }
  }

  console.log(`Parsed lead: firstName="${firstName}", lastName="${lastName}", phone="${phone}", email="${email}", country="${country}"`);
  return { firstName, lastName, phone, email, country };
}


serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting Facebook lead polling (Ad Account method)...");

    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, fb_page_id, fb_page_access_token, fb_user_access_token, fb_ad_account_id, fb_selected_campaigns, fb_selected_adsets")
      .not("fb_page_id", "is", null)
      .not("fb_page_access_token", "is", null);

    if (orgError) throw orgError;

    if (!organizations || organizations.length === 0) {
      console.log("No organizations with Facebook connection found");
      return new Response(
        JSON.stringify({ success: true, message: "No organizations with Facebook connection", newLeadsCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${organizations.length} organizations with Facebook connection`);

    let totalNewLeads = 0;
    const results: Array<{ org: string; newLeads: number; error?: string }> = [];

    for (const org of organizations as Organization[]) {
      try {
        console.log(`Processing organization: ${org.name} (${org.id})`);
        // Use user access token for Ads API calls, fall back to page token
        const userToken = org.fb_user_access_token || org.fb_page_access_token;
        const pageToken = org.fb_page_access_token;

        // Step 1: Get campaign IDs to poll
        const selectedCampaignIds = (org.fb_selected_campaigns || []).map(c => c.id);
        const selectedAdsetIds = new Set((org.fb_selected_adsets || []).map(a => a.id));
        let campaignIds: string[] = [];

        if (selectedCampaignIds.length > 0) {
          // Use pre-selected campaigns
          campaignIds = selectedCampaignIds;
          console.log(`Using ${campaignIds.length} selected campaigns for ${org.name}`);
        } else {
          // No filter: discover ad accounts and get all active campaigns
          console.log(`No campaign filter for ${org.name}, discovering ad accounts...`);

          let adAccountIds: string[] = [];
          if (org.fb_ad_account_id) {
            adAccountIds = [org.fb_ad_account_id.startsWith("act_") ? org.fb_ad_account_id : `act_${org.fb_ad_account_id}`];
          } else {
            const accounts = await fetchAllPages<{ id: string }>(
              `${FB_BASE}/me/adaccounts?access_token=${userToken}&fields=id&limit=100`
            );
            adAccountIds = accounts.map(a => a.id);
          }

          console.log(`Found ${adAccountIds.length} ad accounts for ${org.name}`);

          for (const accountId of adAccountIds) {
            const campaigns = await fetchAllPages<{ id: string }>(
              `${FB_BASE}/${accountId}/campaigns?access_token=${userToken}&fields=id&effective_status=["ACTIVE"]&limit=100`
            );
            campaignIds.push(...campaigns.map(c => c.id));
          }
          console.log(`Found ${campaignIds.length} active campaigns for ${org.name}`);
        }

        if (campaignIds.length === 0) {
          console.log(`No campaigns found for ${org.name}, skipping`);
          results.push({ org: org.name, newLeads: 0 });
          continue;
        }

        // Step 2: Get ads from campaigns
        let orgNewLeads = 0;

        for (const campaignId of campaignIds) {
          const ads = await fetchAllPages<{ id: string }>(
            `${FB_BASE}/${campaignId}/ads?access_token=${userToken}&fields=id,adset_id&limit=100`
          );

          console.log(`Campaign ${campaignId}: found ${ads.length} ads`);

          for (const ad of ads) {
            // Filter by adset if filters exist
            if (selectedAdsetIds.size > 0 && ad.adset_id && !selectedAdsetIds.has(ad.adset_id)) {
              continue;
            }

            // Step 3: Get leads from each ad
            const leads = await fetchAllPages<FacebookLead>(
              `${FB_BASE}/${ad.id}/leads?access_token=${pageToken}&fields=id,created_time,field_data,ad_id,adset_id,campaign_id&limit=100`
            );

            for (const lead of leads) {
              const { firstName, lastName, phone, email, country } = parseLeadFields(lead.field_data || []);

              if (!phone) {
                console.log(`Skipping lead ${lead.id} - no phone number`);
                continue;
              }

              const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");

              // Duplicate check
              const { data: existingLead } = await supabase
                .from("leads")
                .select("id")
                .eq("organization_id", org.id)
                .eq("phone", normalizedPhone)
                .maybeSingle();

              if (existingLead) continue;

              const { error: insertError } = await supabase.from("leads").insert({
                first_name: firstName || "Unknown",
                last_name: lastName || "",
                phone: normalizedPhone,
                email: email || null,
                country: country || null,
                organization_id: org.id,
                source: "Facebook Lead Ads",
                status: "new",
                notes: `Facebook Lead ID: ${lead.id}`,
              });

              if (insertError) {
                console.error(`Error inserting lead:`, insertError);
              } else {
                console.log(`New lead added: ${firstName} ${lastName} (${normalizedPhone})`);
                orgNewLeads++;
                totalNewLeads++;
              }
            }
          }
        }

        // Step 4: Also poll page-level leads to catch test leads and leads not tied to ads
        // BUT only if no campaign filter is set — otherwise we'd pull in unrelated leads
        if (selectedCampaignIds.length === 0) {
          console.log(`Polling page-level leads for ${org.name} (page: ${org.fb_page_id}) — no campaign filter, fetching all...`);
          try {
            const pageLeads = await fetchAllPages<FacebookLead>(
              `${FB_BASE}/${org.fb_page_id}/leads?access_token=${pageToken}&fields=id,created_time,field_data,ad_id,adset_id,campaign_id&limit=100`
            );
            console.log(`Page-level: found ${pageLeads.length} leads for ${org.name}`);

            for (const lead of pageLeads) {
              const { firstName, lastName, phone, email, country } = parseLeadFields(lead.field_data || []);
              if (!phone) continue;

              const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");
              const { data: existingLead } = await supabase
                .from("leads")
                .select("id")
                .eq("organization_id", org.id)
                .eq("phone", normalizedPhone)
                .maybeSingle();

              if (existingLead) continue;

              const { error: insertError } = await supabase.from("leads").insert({
                first_name: firstName || "Unknown",
                last_name: lastName || "",
                phone: normalizedPhone,
                email: email || null,
                country: country || null,
                organization_id: org.id,
                source: "Facebook Lead Ads",
                status: "new",
                notes: `Facebook Lead ID: ${lead.id} (page-level)`,
              });

              if (insertError) {
                console.error(`Error inserting page-level lead:`, insertError);
              } else {
                console.log(`New page-level lead: ${firstName} ${lastName} (${normalizedPhone})`);
                orgNewLeads++;
                totalNewLeads++;
              }
            }
          } catch (pageErr) {
            console.error(`Error polling page-level leads for ${org.name}:`, pageErr);
          }
        } else {
          console.log(`Skipping page-level polling for ${org.name} — campaign filter active (${selectedCampaignIds.length} campaigns selected)`);
        }

        results.push({ org: org.name, newLeads: orgNewLeads });
      } catch (orgErr) {
        console.error(`Error processing org ${org.name}:`, orgErr);
        results.push({ org: org.name, newLeads: 0, error: String(orgErr) });
      }
    }

    console.log(`Polling complete. Total new leads: ${totalNewLeads}`);

    return new Response(
      JSON.stringify({ success: true, newLeadsCount: totalNewLeads, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in poll-facebook-leads:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
