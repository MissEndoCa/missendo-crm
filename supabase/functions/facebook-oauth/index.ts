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

const REQUIRED_PERMISSIONS = [
  'pages_show_list',
  'pages_read_engagement', 
  'leads_retrieval',
  'pages_manage_metadata'
];


const normalizeAdAccountId = (adAccountId: string) => {
  if (!adAccountId) return adAccountId;
  return adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
};

async function checkUserPermissions(accessToken: string): Promise<{
  granted: string[];
  declined: string[];
  missing: string[];
}> {
  const permissionsUrl = `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`;
  const permissionsRes = await fetch(permissionsUrl);
  const permissionsData = await permissionsRes.json();

  console.log('Permissions API response:', JSON.stringify(permissionsData, null, 2));

  if (permissionsData.error) {
    console.error('Permissions check error:', permissionsData.error);
    return { granted: [], declined: [], missing: REQUIRED_PERMISSIONS };
  }

  const granted: string[] = [];
  const declined: string[] = [];

  for (const perm of permissionsData.data || []) {
    if (perm.status === 'granted') {
      granted.push(perm.permission);
    } else if (perm.status === 'declined') {
      declined.push(perm.permission);
    }
  }

  const missing = REQUIRED_PERMISSIONS.filter(p => !granted.includes(p));
  console.log('Permission check result:', { granted, declined, missing });
  return { granted, declined, missing };
}

async function fetchUserPages(accessToken: string): Promise<{
  pages: Array<{ id: string; name: string; access_token?: string }>;
  error?: string;
  debugInfo?: any;
}> {
  console.log('Attempting to fetch pages via me/accounts...');
  const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,category,tasks`;
  const pagesRes = await fetch(pagesUrl);
  const pagesData = await pagesRes.json();

  console.log('me/accounts full response:', JSON.stringify(pagesData, null, 2));

  if (pagesData.error) {
    console.error('me/accounts error:', pagesData.error);
    return { pages: [], error: pagesData.error.message, debugInfo: { method: 'me/accounts', error: pagesData.error } };
  }

  if (pagesData.data && pagesData.data.length > 0) {
    console.log('Found', pagesData.data.length, 'pages via me/accounts');
    return { pages: pagesData.data, debugInfo: { method: 'me/accounts', count: pagesData.data.length } };
  }

  console.log('No pages found via me/accounts, trying businesses endpoint...');
  const businessesUrl = `https://graph.facebook.com/v21.0/me/businesses?access_token=${accessToken}&fields=id,name,owned_pages{id,name,access_token}`;
  const businessesRes = await fetch(businessesUrl);
  const businessesData = await businessesRes.json();

  console.log('me/businesses full response:', JSON.stringify(businessesData, null, 2));

  if (businessesData.data && businessesData.data.length > 0) {
    const allPages: Array<{ id: string; name: string; access_token?: string }> = [];
    for (const business of businessesData.data) {
      if (business.owned_pages?.data) {
        for (const page of business.owned_pages.data) {
          allPages.push({ id: page.id, name: page.name, access_token: page.access_token });
        }
      }
    }
    if (allPages.length > 0) {
      console.log('Found', allPages.length, 'pages via businesses endpoint');
      return { pages: allPages, debugInfo: { method: 'businesses', count: allPages.length } };
    }
  }

  const userUrl = `https://graph.facebook.com/v21.0/me?access_token=${accessToken}&fields=id,name`;
  const userRes = await fetch(userUrl);
  const userData = await userRes.json();
  console.log('User info:', JSON.stringify(userData, null, 2));

  return { 
    pages: [],
    debugInfo: { method: 'all_failed', userId: userData?.id, userName: userData?.name, accountsResponse: pagesData, businessesResponse: businessesData }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).single();

    if (profileError || !profile?.organization_id) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'User not assigned to organization' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = roles?.some(r => r.role === 'super_admin' || r.role === 'clinic_admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { action } = body;
    console.log('Facebook OAuth action:', action, 'for organization:', profile.organization_id);

    switch (action) {
      case 'exchange': {
        const { accessToken } = body;
        if (!accessToken) {
          return new Response(JSON.stringify({ error: 'Access token required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
        const exchangeRes = await fetch(exchangeUrl);
        const exchangeData = await exchangeRes.json();

        if (exchangeData.error) {
          console.error('Token exchange error:', exchangeData.error);
          return new Response(JSON.stringify({ error: exchangeData.error.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Token exchanged successfully, expires in:', exchangeData.expires_in);
        const permissionCheck = await checkUserPermissions(exchangeData.access_token);

        return new Response(JSON.stringify({ 
          longLivedToken: exchangeData.access_token,
          expiresIn: exchangeData.expires_in,
          permissions: permissionCheck
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'check-permissions': {
        const { longLivedToken } = body;
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const permissionCheck = await checkUserPermissions(longLivedToken);
        return new Response(JSON.stringify({ permissions: permissionCheck, requiredPermissions: REQUIRED_PERMISSIONS }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'adaccounts': {
        const { longLivedToken } = body;
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const adAccountsUrl = `https://graph.facebook.com/v21.0/me/adaccounts?access_token=${longLivedToken}&fields=id,name,account_id,account_status&limit=100`;
        const adAccountsRes = await fetch(adAccountsUrl);
        const adAccountsData = await adAccountsRes.json();

        if (adAccountsData.error) {
          console.error('Ad accounts fetch error:', adAccountsData.error);
          return new Response(JSON.stringify({ adAccounts: [], error: adAccountsData.error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const adAccounts = (adAccountsData.data || []).map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          accountId: acc.account_id,
          status: acc.account_status,
        }));

        console.log('Found', adAccounts.length, 'ad accounts');
        return new Response(JSON.stringify({ adAccounts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'pages-by-adaccount': {
        // Get pages promoted under a specific ad account, cross-referenced with user's managed pages
        const { longLivedToken, adAccountId } = body;
        if (!longLivedToken || !adAccountId) {
          return new Response(JSON.stringify({ error: 'Token and ad account ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const normalizedAdAccountId = normalizeAdAccountId(adAccountId);

        // Step 1: Get all pages the user manages (with access tokens)
        const allPagesResult = await fetchUserPages(longLivedToken);
        const userManagedPages = allPagesResult.pages;
        console.log('User manages', userManagedPages.length, 'pages total');

        // Step 2: Get pages promoted under this ad account
        const promoteUrl = `https://graph.facebook.com/v21.0/${normalizedAdAccountId}/promote_pages?access_token=${longLivedToken}&fields=id,name&limit=100`;
        const promoteRes = await fetch(promoteUrl);
        const promoteData = await promoteRes.json();

        console.log('promote_pages response:', JSON.stringify(promoteData, null, 2));

        let adAccountPageIds = new Set<string>();

        if (promoteData.data && promoteData.data.length > 0) {
          for (const p of promoteData.data) {
            adAccountPageIds.add(p.id);
          }
          console.log('Ad account promotes', adAccountPageIds.size, 'pages');
        } else {
          // Fallback: try to get pages from campaigns in this ad account
          console.log('promote_pages returned empty, trying campaigns fallback...');
          const campaignsUrl = `https://graph.facebook.com/v21.0/${normalizedAdAccountId}/campaigns?access_token=${longLivedToken}&fields=id,promoted_object&limit=100`;
          const campaignsRes = await fetch(campaignsUrl);
          const campaignsData = await campaignsRes.json();

          if (campaignsData.data) {
            for (const campaign of campaignsData.data) {
              if (campaign.promoted_object?.page_id) {
                adAccountPageIds.add(campaign.promoted_object.page_id);
              }
            }
          }
          console.log('Found', adAccountPageIds.size, 'pages from campaign promoted_objects');
        }

        const permissionCheck = await checkUserPermissions(longLivedToken);

        // Strict filtering: if we can't find pages for this ad account, do NOT fall back to all pages
        if (adAccountPageIds.size === 0) {
          return new Response(JSON.stringify({
            pages: [],
            error: 'No pages are linked to the selected ad account.',
            errorCode: 'NO_PAGES_FOR_AD_ACCOUNT',
            permissions: permissionCheck,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const filteredPages = userManagedPages
          .filter((p) => adAccountPageIds.has(p.id))
          .map((p) => ({ id: p.id, name: p.name }));

        if (filteredPages.length === 0) {
          return new Response(JSON.stringify({
            pages: [],
            error: 'This ad account has pages, but none are manageable with the current Facebook user.',
            errorCode: 'NO_MANAGED_PAGES_FOR_AD_ACCOUNT',
            permissions: permissionCheck,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Returning', filteredPages.length, 'filtered pages for ad account', normalizedAdAccountId);
        return new Response(JSON.stringify({ pages: filteredPages, permissions: permissionCheck }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'pages': {
        const { longLivedToken } = body;
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Long-lived token required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const permissionCheck = await checkUserPermissions(longLivedToken);
        const criticalMissing = ['pages_show_list', 'pages_read_engagement'].filter(
          p => permissionCheck.missing.includes(p)
        );
        if (criticalMissing.length > 0) {
          console.warn('Missing critical permissions:', criticalMissing);
        }

        const pagesResult = await fetchUserPages(longLivedToken);

        if (pagesResult.pages.length === 0) {
          let errorMessage = 'No Facebook page found.';
          let errorCode = 'NO_PAGES';
          
          if (permissionCheck.missing.length > 0) {
            errorMessage = `Missing permissions: ${permissionCheck.missing.join(', ')}. Please check your Facebook permission settings.`;
            errorCode = 'MISSING_PERMISSIONS';
          } else if (permissionCheck.declined.length > 0) {
            errorMessage = `Declined permissions: ${permissionCheck.declined.join(', ')}. Please re-grant permissions from your Facebook settings.`;
            errorCode = 'DECLINED_PERMISSIONS';
          }

          return new Response(JSON.stringify({ 
            pages: [], error: errorMessage, errorCode, permissions: permissionCheck, debugInfo: pagesResult.debugInfo
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pages = pagesResult.pages.map((page: any) => ({ id: page.id, name: page.name }));
        console.log('Successfully returning', pages.length, 'pages');

        return new Response(JSON.stringify({ pages, permissions: permissionCheck }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'campaigns': {
        const { longLivedToken, adAccountId } = body;
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        let targetAdAccountId = adAccountId;
        if (!targetAdAccountId) {
          const { data: orgData } = await supabase
            .from('organizations').select('fb_ad_account_id').eq('id', profile.organization_id).single();
          targetAdAccountId = orgData?.fb_ad_account_id;
        }

        if (!targetAdAccountId) {
          console.log('No ad account ID specified, returning empty campaigns');
          return new Response(JSON.stringify({ campaigns: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const normalizedAdAccountId = normalizeAdAccountId(targetAdAccountId);

        console.log('Fetching campaigns for ad account:', normalizedAdAccountId);
        const campaignsUrl = `https://graph.facebook.com/v21.0/${normalizedAdAccountId}/campaigns?access_token=${longLivedToken}&fields=id,name,status,objective&limit=100`;
        const campaignsRes = await fetch(campaignsUrl);
        const campaignsData = await campaignsRes.json();

        if (campaignsData.error) {
          console.error('Campaigns fetch error:', campaignsData.error);
          return new Response(JSON.stringify({ error: campaignsData.error.message, campaigns: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const allCampaigns: Array<{id: string, name: string, status: string, adAccountId: string}> = [];
        for (const campaign of campaignsData.data || []) {
          if (campaign.objective === 'LEAD_GENERATION' || campaign.status === 'ACTIVE') {
            allCampaigns.push({
              id: campaign.id, name: campaign.name, status: campaign.status, adAccountId: normalizedAdAccountId
            });
          }
        }

        console.log('Found', allCampaigns.length, 'lead/active campaigns for', normalizedAdAccountId);
        return new Response(JSON.stringify({ campaigns: allCampaigns }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'adsets': {
        const { longLivedToken, campaignIds } = body;
        if (!longLivedToken || !campaignIds || !Array.isArray(campaignIds)) {
          return new Response(JSON.stringify({ error: 'Token and campaign IDs required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const allAdsets: Array<{id: string, name: string, status: string, campaignId: string}> = [];
        for (const campaignId of campaignIds) {
          const adsetsUrl = `https://graph.facebook.com/v21.0/${campaignId}/adsets?access_token=${longLivedToken}&fields=id,name,status&limit=100`;
          const adsetsRes = await fetch(adsetsUrl);
          const adsetsData = await adsetsRes.json();
          if (adsetsData.data) {
            for (const adset of adsetsData.data) {
              allAdsets.push({ id: adset.id, name: adset.name, status: adset.status, campaignId });
            }
          }
        }

        console.log('Found', allAdsets.length, 'ad sets');
        return new Response(JSON.stringify({ adsets: allAdsets }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'connect': {
        const { longLivedToken, pageId, pageName, fbUserId, selectedAdAccountId, selectedCampaigns, selectedAdsets } = body;
        if (!longLivedToken || !pageId) {
          return new Response(JSON.stringify({ error: 'Token and page ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const normalizedSelectedAdAccountId = selectedAdAccountId
          ? normalizeAdAccountId(selectedAdAccountId)
          : null;

        const pagesResult = await fetchUserPages(longLivedToken);
        if (pagesResult.error) {
          return new Response(JSON.stringify({ error: pagesResult.error }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const selectedPage = pagesResult.pages.find((p: any) => p.id === pageId);
        if (!selectedPage) {
          return new Response(JSON.stringify({ error: 'Page not found or access denied.', errorCode: 'PAGE_NOT_FOUND' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pageAccessToken = selectedPage.access_token;
        if (!pageAccessToken) {
          return new Response(JSON.stringify({ error: 'Could not retrieve page access token.', errorCode: 'NO_PAGE_TOKEN' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Got page access token for:', selectedPage.name);

        const subscribeUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
        const subscribeRes = await fetch(subscribeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: pageAccessToken, subscribed_fields: ['leadgen'] })
        });
        const subscribeData = await subscribeRes.json();
        console.log('Webhook subscription result:', subscribeData);

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            fb_page_access_token: pageAccessToken,
            fb_user_access_token: longLivedToken,
            fb_page_id: pageId,
            fb_page_name: pageName || selectedPage.name,
            fb_connected_at: new Date().toISOString(),
            fb_user_id: fbUserId || null,
            fb_ad_account_id: normalizedSelectedAdAccountId,
            fb_selected_campaigns: selectedCampaigns || [],
            fb_selected_adsets: selectedAdsets || [],
          })
          .eq('id', profile.organization_id);

        if (updateError) {
          console.error('Database update error:', updateError);
          return new Response(JSON.stringify({ error: 'Failed to save connection' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Facebook connected for org:', profile.organization_id, 'Ad account:', normalizedSelectedAdAccountId);

        return new Response(JSON.stringify({ 
          success: true, pageName: selectedPage.name, pageId, adAccountId: normalizedSelectedAdAccountId,
          webhookSubscribed: !subscribeData.error,
          campaignsCount: selectedCampaigns?.length || 0, adsetsCount: selectedAdsets?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update-filters': {
        const { selectedCampaigns, selectedAdsets } = body;
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ fb_selected_campaigns: selectedCampaigns || [], fb_selected_adsets: selectedAdsets || [] })
          .eq('id', profile.organization_id);

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Failed to update filters' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true, campaignsCount: selectedCampaigns?.length || 0, adsetsCount: selectedAdsets?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-filters': {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('fb_selected_campaigns, fb_selected_adsets, fb_page_access_token, fb_ad_account_id')
          .eq('id', profile.organization_id)
          .single();

        if (orgError) {
          return new Response(JSON.stringify({ error: 'Failed to get filters' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          selectedCampaigns: orgData?.fb_selected_campaigns || [],
          selectedAdsets: orgData?.fb_selected_adsets || [],
          adAccountId: orgData?.fb_ad_account_id || null,
          hasToken: !!orgData?.fb_page_access_token
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'disconnect': {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            fb_page_access_token: null, fb_user_access_token: null, fb_page_id: null,
            fb_page_name: null, fb_connected_at: null, fb_user_id: null, fb_ad_account_id: null,
            fb_selected_campaigns: [], fb_selected_adsets: [],
          })
          .eq('id', profile.organization_id);

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Facebook disconnected for org:', profile.organization_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error: unknown) {
    console.error('Facebook OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
