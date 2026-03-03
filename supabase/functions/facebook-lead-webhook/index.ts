import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FB_API_VERSION = "v21.0";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Facebook Webhook Verification (GET request)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const VERIFY_TOKEN = Deno.env.get('FB_WEBHOOK_VERIFY_TOKEN');
    if (!VERIFY_TOKEN) {
      console.error('FB_WEBHOOK_VERIFY_TOKEN is not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    } else {
      console.error('Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Handle Lead Data (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received webhook payload:', JSON.stringify(body, null, 2));

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          const pageId = entry.id;
          console.log('Processing entry for page:', pageId);

          for (const change of entry.changes || []) {
            if (change.field === 'leadgen') {
              const leadgenId = change.value.leadgen_id;
              const formId = change.value.form_id;
              const adId = change.value.ad_id;
              const adgroupId = change.value.adgroup_id;

              console.log('Lead received:', { leadgenId, formId, adId, adgroupId, pageId });

              // First try to match org by page_id
              const { data: orgs, error: orgError } = await supabase
                .from('organizations')
                .select('id, fb_page_id, fb_page_access_token, fb_user_access_token, fb_selected_campaigns, fb_selected_adsets')
                .not('fb_page_access_token', 'is', null);

              if (orgError) {
                console.error('Error fetching organizations:', orgError);
                continue;
              }

              // Prefer org matching by page_id, fallback to trying all tokens
              const matchedOrgs = (orgs || []).filter(o => o.fb_page_id === pageId);
              const orgsToTry = matchedOrgs.length > 0 ? matchedOrgs : (orgs || []);

              for (const org of orgsToTry) {
                try {
                  // Fetch lead details from Facebook Graph API
                  const leadResponse = await fetch(
                    `https://graph.facebook.com/${FB_API_VERSION}/${leadgenId}?access_token=${org.fb_page_access_token}`
                  );

                  if (!leadResponse.ok) {
                    console.log(`Token for org ${org.id} didn't work, trying next...`);
                    continue;
                  }

                  const leadData = await leadResponse.json();
                  console.log('Lead data from Facebook:', JSON.stringify(leadData, null, 2));

                  // --- Campaign filtering ---
                  const selectedCampaigns: Array<{id: string}> = org.fb_selected_campaigns || [];
                  const selectedAdsets: Array<{id: string}> = org.fb_selected_adsets || [];

                  if (selectedCampaigns.length > 0 && adId) {
                    // We need to check if this ad belongs to a selected campaign
                    // Fetch the ad's campaign_id from Facebook
                    const userToken = org.fb_user_access_token || org.fb_page_access_token;
                    const adInfoRes = await fetch(
                      `https://graph.facebook.com/${FB_API_VERSION}/${adId}?fields=campaign_id,adset_id&access_token=${userToken}`
                    );

                    if (adInfoRes.ok) {
                      const adInfo = await adInfoRes.json();
                      const adCampaignId = adInfo.campaign_id;
                      const adAdsetId = adInfo.adset_id;

                      console.log(`Ad ${adId} belongs to campaign=${adCampaignId}, adset=${adAdsetId}`);

                      const campaignIds = selectedCampaigns.map(c => c.id);
                      if (!campaignIds.includes(adCampaignId)) {
                        console.log(`Lead REJECTED: campaign ${adCampaignId} not in selected campaigns [${campaignIds.join(', ')}]`);
                        break; // Don't try other orgs, this lead is filtered out
                      }

                      // Also check adset filter if set
                      if (selectedAdsets.length > 0 && adAdsetId) {
                        const adsetIds = selectedAdsets.map(a => a.id);
                        if (!adsetIds.includes(adAdsetId)) {
                          console.log(`Lead REJECTED: adset ${adAdsetId} not in selected adsets [${adsetIds.join(', ')}]`);
                          break;
                        }
                      }

                      console.log('Lead ACCEPTED: matches campaign/adset filter');
                    } else {
                      console.log(`Could not fetch ad info for ${adId}, accepting lead by default`);
                    }
                  }

                  // Parse lead fields
                  const fields: Record<string, string> = {};
                  for (const field of leadData.field_data || []) {
                    fields[field.name.toLowerCase()] = field.values?.[0] || '';
                  }

                  console.log('Parsed fields:', fields);

                  // Extract names - check all possible field name variations
                  const fullName = fields.full_name || fields['full name'] || fields.fullname ||
                    fields['ad_soyad'] || fields['ad soyad'] || fields['tam ad'] || fields['tam_ad'] ||
                    fields['полное_имя'] || fields['nome_completo'] || fields['nom_complet'] ||
                    fields['imię_i_nazwisko'] || fields['nombre_completo'] || fields['vollständiger_name'] ||
                    fields.name || '';

                  const fnDirect = fields.first_name || fields.firstname || fields.ad ||
                    fields['adınız'] || fields.isim || fields['имя'] || fields.nome || fields['prénom'] || '';
                  const lnDirect = fields.last_name || fields.lastname || fields.soyad ||
                    fields['soyadınız'] || fields['фамилия'] || fields.cognome || fields.nom || '';

                  let firstName = fnDirect;
                  let lastName = lnDirect;

                  if (!firstName && fullName) {
                    const parts = fullName.trim().split(/\s+/);
                    firstName = parts[0] || '';
                    lastName = parts.slice(1).join(' ') || lastName;
                  }

                  firstName = firstName || 'Unknown';
                  lastName = lastName || '';

                  const email = fields.email || fields['e-posta'] || fields.eposta ||
                    fields['e_mail'] || fields['e-mail'] || fields.mail ||
                    fields['эл._адрес'] || fields['электронная_почта'] ||
                    fields['adres_e-mail'] || fields['correo_electrónico'] || fields['e-mail-adresse'] || null;
                  const phone = fields.phone_number || fields.phone || fields.telefon ||
                    fields.tel || fields['cep_telefonu'] || fields['номер_телефона'] ||
                    fields['numer_telefonu'] || fields['número_de_teléfono'] || fields.telefonnummer ||
                    fields.mobile || 'N/A';
                  const country = fields.country || fields.ulke || fields['ülke'] ||
                    fields['страна'] || fields.paese || fields.pays || null;

                  console.log(`Parsed lead: firstName="${firstName}", lastName="${lastName}", phone="${phone}", email="${email}"`);

                  // Check for duplicate leads
                  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");
                  const { data: existingLead } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('organization_id', org.id)
                    .eq('phone', normalizedPhone)
                    .maybeSingle();

                  if (existingLead) {
                    console.log('Duplicate lead detected, skipping:', normalizedPhone);
                    break;
                  }

                  const { data: newLead, error: insertError } = await supabase
                    .from('leads')
                    .insert({
                      organization_id: org.id,
                      first_name: firstName,
                      last_name: lastName,
                      email: email,
                      phone: normalizedPhone,
                      country: country,
                      source: 'Facebook Lead Ads',
                      status: 'new',
                      notes: `Facebook Lead ID: ${leadgenId}\nForm ID: ${formId}\nAd ID: ${adId || 'N/A'}\n\nAll Fields:\n${JSON.stringify(fields, null, 2)}`,
                    })
                    .select()
                    .single();

                  if (insertError) {
                    console.error('Error inserting lead:', insertError);
                  } else {
                    console.log('Lead inserted successfully:', newLead.id);
                  }

                  break;
                } catch (fetchError) {
                  console.error(`Error fetching lead for org ${org.id}:`, fetchError);
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ success: false, error: String(error) }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
