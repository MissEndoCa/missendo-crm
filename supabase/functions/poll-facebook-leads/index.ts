import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FacebookLead {
  id: string;
  created_time: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
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
  fb_selected_campaigns: SelectedItem[];
  fb_selected_adsets: SelectedItem[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting Facebook lead polling...");

    // Get all organizations with Facebook connection
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, fb_page_id, fb_page_access_token, fb_selected_campaigns, fb_selected_adsets")
      .not("fb_page_id", "is", null)
      .not("fb_page_access_token", "is", null);

    if (orgError) {
      console.error("Error fetching organizations:", orgError);
      throw orgError;
    }

    if (!organizations || organizations.length === 0) {
      console.log("No organizations with Facebook connection found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No organizations with Facebook connection",
          newLeadsCount: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${organizations.length} organizations with Facebook connection`);

    let totalNewLeads = 0;
    const results: Array<{ org: string; newLeads: number; error?: string }> = [];

    for (const org of organizations as Organization[]) {
      try {
        console.log(`Processing organization: ${org.name} (${org.id})`);

        // Get leadgen forms for the page
        const formsResponse = await fetch(
          `https://graph.facebook.com/v21.0/${org.fb_page_id}/leadgen_forms?access_token=${org.fb_page_access_token}`
        );

        if (!formsResponse.ok) {
          const errorText = await formsResponse.text();
          console.error(`Error fetching forms for ${org.name}:`, errorText);
          results.push({ org: org.name, newLeads: 0, error: "Failed to fetch forms" });
          continue;
        }

        const formsData = await formsResponse.json();
        const forms = formsData.data || [];

        console.log(`Found ${forms.length} leadgen forms for ${org.name}`);

        let orgNewLeads = 0;

        // Get campaign/adset filter IDs
        const selectedCampaignIds = new Set((org.fb_selected_campaigns || []).map(c => c.id));
        const selectedAdsetIds = new Set((org.fb_selected_adsets || []).map(a => a.id));
        const hasFilters = selectedCampaignIds.size > 0 || selectedAdsetIds.size > 0;

        console.log(`Org ${org.name} filters - Campaigns: ${selectedCampaignIds.size}, Adsets: ${selectedAdsetIds.size}`);

        for (const form of forms) {
          // Get leads from the form with ad info (last 7 days)
          const leadsResponse = await fetch(
            `https://graph.facebook.com/v21.0/${form.id}/leads?access_token=${org.fb_page_access_token}&limit=100&fields=id,created_time,field_data,ad_id,adset_id,campaign_id`
          );

          if (!leadsResponse.ok) {
            console.error(`Error fetching leads from form ${form.id}`);
            continue;
          }

          const leadsData = await leadsResponse.json();
          const leads: FacebookLead[] = leadsData.data || [];

          console.log(`Found ${leads.length} leads in form ${form.id}`);

          for (const lead of leads) {
            // Check campaign/adset filters before processing
            if (hasFilters) {
              const leadCampaignId = lead.campaign_id;
              const leadAdsetId = lead.adset_id;

              // If we have campaign filters, check if this lead's campaign matches
              if (selectedCampaignIds.size > 0 && leadCampaignId) {
                if (!selectedCampaignIds.has(leadCampaignId)) {
                  console.log(`Skipping lead ${lead.id} - campaign ${leadCampaignId} not in filter`);
                  continue;
                }
              }

              // If we have adset filters, check if this lead's adset matches
              if (selectedAdsetIds.size > 0 && leadAdsetId) {
                if (!selectedAdsetIds.has(leadAdsetId)) {
                  console.log(`Skipping lead ${lead.id} - adset ${leadAdsetId} not in filter`);
                  continue;
                }
              }
            }

            // Parse lead data
            const fieldData = lead.field_data || [];
            let firstName = "";
            let lastName = "";
            let phone = "";
            let email = "";
            let country = "";

            for (const field of fieldData) {
              const value = field.values?.[0] || "";
              const fieldName = field.name.toLowerCase();

              if (fieldName.includes("first_name") || fieldName === "ad") {
                firstName = value;
              } else if (fieldName.includes("last_name") || fieldName === "soyad") {
                lastName = value;
              } else if (fieldName.includes("full_name") || fieldName === "full name") {
                const parts = value.split(" ");
                firstName = parts[0] || "";
                lastName = parts.slice(1).join(" ") || "";
              } else if (fieldName.includes("phone") || fieldName.includes("telefon")) {
                phone = value;
              } else if (fieldName.includes("email") || fieldName.includes("e-posta")) {
                email = value;
              } else if (fieldName.includes("country") || fieldName.includes("ülke")) {
                country = value;
              }
            }

            // Skip if no phone number
            if (!phone) {
              console.log(`Skipping lead ${lead.id} - no phone number`);
              continue;
            }

            // Normalize phone number (remove spaces, dashes)
            const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");

            // Check for duplicate (same phone in same organization)
            const { data: existingLead } = await supabase
              .from("leads")
              .select("id")
              .eq("organization_id", org.id)
              .eq("phone", normalizedPhone)
              .maybeSingle();

            if (existingLead) {
              console.log(`Skipping duplicate lead: ${normalizedPhone}`);
              continue;
            }

            // Insert new lead
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

        results.push({ org: org.name, newLeads: orgNewLeads });
      } catch (orgError) {
        console.error(`Error processing org ${org.name}:`, orgError);
        results.push({ org: org.name, newLeads: 0, error: String(orgError) });
      }
    }

    console.log(`Polling complete. Total new leads: ${totalNewLeads}`);

    return new Response(
      JSON.stringify({
        success: true,
        newLeadsCount: totalNewLeads,
        results,
      }),
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
