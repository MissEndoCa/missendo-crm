 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   const url = new URL(req.url);
 
   // Facebook Webhook Verification (GET request)
   if (req.method === 'GET') {
     const mode = url.searchParams.get('hub.mode');
     const token = url.searchParams.get('hub.verify_token');
     const challenge = url.searchParams.get('hub.challenge');
 
     console.log('Webhook verification request:', { mode, token, challenge });
 
     const VERIFY_TOKEN = Deno.env.get('FB_WEBHOOK_VERIFY_TOKEN') || 'missendo_leads_2024';
 
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
 
       // Facebook sends data in this format
       if (body.object === 'page') {
         for (const entry of body.entry || []) {
           const pageId = entry.id;
           console.log('Processing entry for page:', pageId);
 
           // Find organization by page access token or ad account
           // For now, we'll match by checking which org has this page configured
           
           for (const change of entry.changes || []) {
             if (change.field === 'leadgen') {
               const leadgenId = change.value.leadgen_id;
               const formId = change.value.form_id;
               const adId = change.value.ad_id;
               const adgroupId = change.value.adgroup_id;
               
               console.log('Lead received:', { leadgenId, formId, adId, adgroupId, pageId });
 
               // Get the organization that owns this page
               // We need to fetch the actual lead data from Facebook
               const { data: orgs, error: orgError } = await supabase
                 .from('organizations')
                 .select('id, fb_page_access_token, fb_ad_account_id')
                 .not('fb_page_access_token', 'is', null);
 
               if (orgError) {
                 console.error('Error fetching organizations:', orgError);
                 continue;
               }
 
               // Try each organization's token to fetch the lead
               for (const org of orgs || []) {
                 try {
                   // Fetch lead details from Facebook Graph API
                   const leadResponse = await fetch(
                     `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${org.fb_page_access_token}`
                   );
                   
                   if (!leadResponse.ok) {
                     console.log(`Token for org ${org.id} didn't work, trying next...`);
                     continue;
                   }
 
                   const leadData = await leadResponse.json();
                   console.log('Lead data from Facebook:', JSON.stringify(leadData, null, 2));
 
                   // Parse lead fields
                   const fields: Record<string, string> = {};
                   for (const field of leadData.field_data || []) {
                     fields[field.name.toLowerCase()] = field.values?.[0] || '';
                   }
 
                   console.log('Parsed fields:', fields);
 
                   // Extract common field names (Facebook uses various naming conventions)
                   const firstName = fields.first_name || fields.firstname || fields.name?.split(' ')[0] || 'Facebook';
                   const lastName = fields.last_name || fields.lastname || fields.name?.split(' ').slice(1).join(' ') || 'Lead';
                   const email = fields.email || fields.e_mail || null;
                   const phone = fields.phone_number || fields.phone || fields.telefon || fields.tel || 'N/A';
                   const country = fields.country || fields.ulke || fields.ülke || null;
 
                   // Check for duplicate leads (same phone in same org)
                   const { data: existingLead } = await supabase
                     .from('leads')
                     .select('id')
                     .eq('organization_id', org.id)
                     .eq('phone', phone)
                     .single();
 
                   if (existingLead) {
                     console.log('Duplicate lead detected, skipping:', phone);
                     continue;
                   }
 
                   // Insert lead
                   const { data: newLead, error: insertError } = await supabase
                     .from('leads')
                     .insert({
                       organization_id: org.id,
                       first_name: firstName,
                       last_name: lastName,
                       email: email,
                       phone: phone,
                       country: country,
                       source: 'facebook_ads',
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
 
                   // We found the right org, no need to try others
                   break;
 
                 } catch (fetchError) {
                   console.error(`Error fetching lead for org ${org.id}:`, fetchError);
                 }
               }
             }
           }
         }
       }
 
       // Facebook expects a 200 response quickly
       return new Response(JSON.stringify({ success: true }), {
         status: 200,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
 
     } catch (error) {
       console.error('Error processing webhook:', error);
       // Still return 200 to prevent Facebook from retrying
       return new Response(JSON.stringify({ success: false, error: String(error) }), {
         status: 200,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }
   }
 
   return new Response('Method not allowed', { status: 405 });
 });