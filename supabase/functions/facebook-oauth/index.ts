import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FB_APP_ID = Deno.env.get('FB_APP_ID')!;
const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create authenticated client to get user info using anon key
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user profile to check organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'User not assigned to organization' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'super_admin' || r.role === 'clinic_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action } = body;

    console.log('Facebook OAuth action:', action, 'for organization:', profile.organization_id);

    switch (action) {
      case 'exchange': {
        // Exchange short-lived token for long-lived token
        const { accessToken } = body;
        
        if (!accessToken) {
          return new Response(JSON.stringify({ error: 'Access token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Exchange for long-lived token (60 days)
        const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
        
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
          console.error('Token exchange error:', exchangeData.error);
          return new Response(JSON.stringify({ error: exchangeData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Token exchanged successfully, expires in:', exchangeData.expires_in);

        return new Response(JSON.stringify({ 
          longLivedToken: exchangeData.access_token,
          expiresIn: exchangeData.expires_in
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'pages': {
        // Get user's pages with their tokens
        const { longLivedToken } = body;
        
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Long-lived token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token`;
        
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
          console.error('Pages fetch error:', pagesData.error);
          return new Response(JSON.stringify({ error: pagesData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Found', pagesData.data?.length || 0, 'pages');

        // Return pages without exposing tokens to frontend
        const pages = pagesData.data?.map((page: any) => ({
          id: page.id,
          name: page.name,
        })) || [];

        return new Response(JSON.stringify({ pages }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'campaigns': {
        // Get campaigns for ad account
        const { longLivedToken, pageId } = body;
        
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // First get ad accounts linked to the user
        const adAccountsUrl = `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${longLivedToken}&fields=id,name,account_id`;
        const adAccountsRes = await fetch(adAccountsUrl);
        const adAccountsData = await adAccountsRes.json();

        if (adAccountsData.error) {
          console.error('Ad accounts fetch error:', adAccountsData.error);
          return new Response(JSON.stringify({ error: adAccountsData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Found', adAccountsData.data?.length || 0, 'ad accounts');

        // Get campaigns from all ad accounts
        const allCampaigns: Array<{id: string, name: string, status: string, adAccountId: string}> = [];
        
        for (const adAccount of adAccountsData.data || []) {
          const campaignsUrl = `https://graph.facebook.com/v19.0/${adAccount.id}/campaigns?access_token=${longLivedToken}&fields=id,name,status,objective&limit=100`;
          const campaignsRes = await fetch(campaignsUrl);
          const campaignsData = await campaignsRes.json();

          if (campaignsData.data) {
            for (const campaign of campaignsData.data) {
              // Only include LEAD_GENERATION campaigns or all active campaigns
              if (campaign.objective === 'LEAD_GENERATION' || campaign.status === 'ACTIVE') {
                allCampaigns.push({
                  id: campaign.id,
                  name: campaign.name,
                  status: campaign.status,
                  adAccountId: adAccount.id
                });
              }
            }
          }
        }

        console.log('Found', allCampaigns.length, 'lead/active campaigns');

        return new Response(JSON.stringify({ campaigns: allCampaigns }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'adsets': {
        // Get ad sets for selected campaigns
        const { longLivedToken, campaignIds } = body;
        
        if (!longLivedToken || !campaignIds || !Array.isArray(campaignIds)) {
          return new Response(JSON.stringify({ error: 'Token and campaign IDs required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const allAdsets: Array<{id: string, name: string, status: string, campaignId: string}> = [];
        
        for (const campaignId of campaignIds) {
          const adsetsUrl = `https://graph.facebook.com/v19.0/${campaignId}/adsets?access_token=${longLivedToken}&fields=id,name,status&limit=100`;
          const adsetsRes = await fetch(adsetsUrl);
          const adsetsData = await adsetsRes.json();

          if (adsetsData.data) {
            for (const adset of adsetsData.data) {
              allAdsets.push({
                id: adset.id,
                name: adset.name,
                status: adset.status,
                campaignId: campaignId
              });
            }
          }
        }

        console.log('Found', allAdsets.length, 'ad sets');

        return new Response(JSON.stringify({ adsets: allAdsets }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'connect': {
        // Connect a specific page with optional campaign/adset filters
        const { longLivedToken, pageId, pageName, fbUserId, selectedCampaigns, selectedAdsets } = body;
        
        if (!longLivedToken || !pageId) {
          return new Response(JSON.stringify({ error: 'Token and page ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get page access token (this is a never-expiring token)
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
          console.error('Pages fetch error:', pagesData.error);
          return new Response(JSON.stringify({ error: pagesData.error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const selectedPage = pagesData.data?.find((p: any) => p.id === pageId);
        if (!selectedPage) {
          return new Response(JSON.stringify({ error: 'Page not found or no access' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pageAccessToken = selectedPage.access_token;
        console.log('Got page access token for:', selectedPage.name);

        // Subscribe to leadgen webhook
        const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`;
        const subscribeRes = await fetch(subscribeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: pageAccessToken,
            subscribed_fields: ['leadgen']
          })
        });
        
        const subscribeData = await subscribeRes.json();
        console.log('Webhook subscription result:', subscribeData);

        if (subscribeData.error) {
          console.error('Webhook subscribe error:', subscribeData.error);
          // Don't fail completely, token is still valid
        }

        // Save to database with campaign/adset selections
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            fb_page_access_token: pageAccessToken,
            fb_page_id: pageId,
            fb_page_name: pageName || selectedPage.name,
            fb_connected_at: new Date().toISOString(),
            fb_user_id: fbUserId || null,
            fb_selected_campaigns: selectedCampaigns || [],
            fb_selected_adsets: selectedAdsets || [],
          })
          .eq('id', profile.organization_id);

        if (updateError) {
          console.error('Database update error:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to save connection' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Facebook page connected successfully for org:', profile.organization_id);
        console.log('Selected campaigns:', selectedCampaigns?.length || 0, 'Selected adsets:', selectedAdsets?.length || 0);

        return new Response(JSON.stringify({ 
          success: true,
          pageName: selectedPage.name,
          pageId: pageId,
          webhookSubscribed: !subscribeData.error,
          campaignsCount: selectedCampaigns?.length || 0,
          adsetsCount: selectedAdsets?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update-filters': {
        // Update campaign/adset filters for existing connection
        const { selectedCampaigns, selectedAdsets } = body;

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            fb_selected_campaigns: selectedCampaigns || [],
            fb_selected_adsets: selectedAdsets || [],
          })
          .eq('id', profile.organization_id);

        if (updateError) {
          console.error('Filter update error:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to update filters' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Filters updated for org:', profile.organization_id);

        return new Response(JSON.stringify({ 
          success: true,
          campaignsCount: selectedCampaigns?.length || 0,
          adsetsCount: selectedAdsets?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-filters': {
        // Get current campaign/adset filters
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('fb_selected_campaigns, fb_selected_adsets, fb_page_access_token')
          .eq('id', profile.organization_id)
          .single();

        if (orgError) {
          console.error('Get filters error:', orgError);
          return new Response(JSON.stringify({ error: 'Failed to get filters' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          selectedCampaigns: orgData?.fb_selected_campaigns || [],
          selectedAdsets: orgData?.fb_selected_adsets || [],
          hasToken: !!orgData?.fb_page_access_token
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'disconnect': {
        // Remove Facebook connection
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            fb_page_access_token: null,
            fb_page_id: null,
            fb_page_name: null,
            fb_connected_at: null,
            fb_user_id: null,
            fb_selected_campaigns: [],
            fb_selected_adsets: [],
          })
          .eq('id', profile.organization_id);

        if (updateError) {
          console.error('Disconnect error:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Facebook disconnected for org:', profile.organization_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error: unknown) {
    console.error('Facebook OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});