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
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // NOTE: Authorization is open to any authenticated user in the organization.
    // All users in a clinic can connect/manage Facebook and share the same connection.
    // TODO: Restrict to admins later if needed.

    const body = await req.json();
    const { action } = body;
    console.log('Facebook OAuth action:', action, 'for organization:', profile.organization_id);

    switch (action) {
      case 'exchange': {
        const { accessToken, code } = body;
        if (!accessToken && !code) {
          return new Response(JSON.stringify({ error: 'Access token or authorization code required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        let exchangeData: any;
        if (code) {
          const codeExchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&code=${encodeURIComponent(code)}`;
          const codeExchangeRes = await fetch(codeExchangeUrl);
          const codeExchangeData = await codeExchangeRes.json();

          if (codeExchangeData.error) {
            console.error('Authorization code exchange error:', codeExchangeData.error);
            return new Response(JSON.stringify({ error: codeExchangeData.error.message }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${codeExchangeData.access_token}`;
          const longLivedRes = await fetch(longLivedUrl);
          exchangeData = await longLivedRes.json();
        } else {
          const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
          const exchangeRes = await fetch(exchangeUrl);
          exchangeData = await exchangeRes.json();
        }

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
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        // Get pages promoted under a specific ad account, then resolve page names
        const { longLivedToken, adAccountId } = body;
        if (!longLivedToken || !adAccountId) {
          return new Response(JSON.stringify({ error: 'Token and ad account ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const normalizedAdAccountId = normalizeAdAccountId(adAccountId);

        // Step 1: Get all pages the user manages (includes access_token when available)
        const allPagesResult = await fetchUserPages(longLivedToken);
        const userManagedPages = allPagesResult.pages;
        const userManagedMap = new Map(userManagedPages.map((p) => [p.id, p]));
        console.log('User manages', userManagedPages.length, 'pages total');

        // Step 2: Get pages promoted under this ad account
        const promoteUrl = `https://graph.facebook.com/v21.0/${normalizedAdAccountId}/promote_pages?access_token=${longLivedToken}&fields=id,name&limit=100`;
        const promoteRes = await fetch(promoteUrl);
        const promoteData = await promoteRes.json();

        console.log('promote_pages response:', JSON.stringify(promoteData, null, 2));

        const candidatePages = new Map<string, { id: string; name?: string }>();

        if (promoteData.data && promoteData.data.length > 0) {
          for (const p of promoteData.data) {
            candidatePages.set(p.id, { id: p.id, name: p.name });
          }
          console.log('Ad account promotes', candidatePages.size, 'pages');
        } else {
          // Fallback: derive page IDs from campaign promoted_object.page_id
          console.log('promote_pages returned empty, trying campaigns fallback...');
          const campaignsUrl = `https://graph.facebook.com/v21.0/${normalizedAdAccountId}/campaigns?access_token=${longLivedToken}&fields=id,promoted_object&limit=100`;
          const campaignsRes = await fetch(campaignsUrl);
          const campaignsData = await campaignsRes.json();

          if (campaignsData.data) {
            for (const campaign of campaignsData.data) {
              if (campaign.promoted_object?.page_id) {
                candidatePages.set(campaign.promoted_object.page_id, { id: campaign.promoted_object.page_id });
              }
            }
          }
          console.log('Found', candidatePages.size, 'pages from campaign promoted_objects');
        }

        const permissionCheck = await checkUserPermissions(longLivedToken);

        if (candidatePages.size === 0) {
          return new Response(JSON.stringify({
            pages: [],
            error: 'No pages are linked to the selected ad account.',
            errorCode: 'NO_PAGES_FOR_AD_ACCOUNT',
            permissions: permissionCheck,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Step 3: Resolve final page list (prefer managed page data; fallback to direct page lookup)
        const resolvedPages: Array<{ id: string; name: string }> = [];

        for (const candidate of candidatePages.values()) {
          const managedPage = userManagedMap.get(candidate.id);
          if (managedPage) {
            resolvedPages.push({ id: managedPage.id, name: managedPage.name });
            continue;
          }

          // Fallback for Business Manager-shared pages not returned by me/accounts
          const pageInfoUrl = `https://graph.facebook.com/v21.0/${candidate.id}?fields=id,name&access_token=${longLivedToken}`;
          const pageInfoRes = await fetch(pageInfoUrl);
          const pageInfoData = await pageInfoRes.json();

          if (!pageInfoData.error && pageInfoData.id && pageInfoData.name) {
            resolvedPages.push({ id: pageInfoData.id, name: pageInfoData.name });
          } else if (candidate.name) {
            // Keep page visible if promote_pages already returned a valid name
            resolvedPages.push({ id: candidate.id, name: candidate.name });
          }
        }

        const uniquePages = Array.from(new Map(resolvedPages.map((p) => [p.id, p])).values());

        if (uniquePages.length === 0) {
          return new Response(JSON.stringify({
            pages: [],
            error: 'This ad account has pages, but none are visible to the current Facebook user.',
            errorCode: 'NO_VISIBLE_PAGES_FOR_AD_ACCOUNT',
            permissions: permissionCheck,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Returning', uniquePages.length, 'pages for ad account', normalizedAdAccountId);
        return new Response(JSON.stringify({ pages: uniquePages, permissions: permissionCheck }), {
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
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

        let selectedPage = pagesResult.pages.find((p: any) => p.id === pageId);
        let pageAccessToken = selectedPage?.access_token;

        // Fallback: some Business Manager pages may not appear in me/accounts, try direct page lookup
        if (!selectedPage || !pageAccessToken) {
          const directPageUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,access_token&access_token=${longLivedToken}`;
          const directPageRes = await fetch(directPageUrl);
          const directPageData = await directPageRes.json();

          if (!directPageData.error && directPageData.id) {
            selectedPage = {
              id: directPageData.id,
              name: directPageData.name || pageName || 'Selected Page',
              access_token: directPageData.access_token,
            };
            pageAccessToken = directPageData.access_token;
          }
        }

        if (!selectedPage) {
          return new Response(JSON.stringify({ error: 'Page not found or access denied.', errorCode: 'PAGE_NOT_FOUND' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!pageAccessToken) {
          return new Response(JSON.stringify({
            error: 'Could not retrieve page access token for this page. Please make sure this Facebook user has Page access in Meta Business Suite.',
            errorCode: 'NO_PAGE_TOKEN'
          }), {
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

      case 'diagnostics': {
        const { pageId: diagPageId } = body;
        
        // Get org's page access token
        const { data: orgDiag } = await supabase
          .from('organizations')
          .select('fb_page_access_token, fb_page_id')
          .eq('id', profile.organization_id)
          .single();

        const tokenToUse = orgDiag?.fb_page_access_token;
        const targetPageId = diagPageId || orgDiag?.fb_page_id;

        if (!tokenToUse || !targetPageId) {
          return new Response(JSON.stringify({ error: 'Facebook not connected' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check webhook subscriptions
        let webhookActive = false;
        let leadgenSubscribed = false;
        try {
          const subsUrl = `https://graph.facebook.com/v21.0/${targetPageId}/subscribed_apps?access_token=${tokenToUse}`;
          const subsRes = await fetch(subsUrl);
          const subsData = await subsRes.json();
          console.log('Subscribed apps:', JSON.stringify(subsData));
          if (subsData.data && subsData.data.length > 0) {
            webhookActive = true;
            for (const app of subsData.data) {
              if (app.subscribed_fields?.includes('leadgen')) {
                leadgenSubscribed = true;
                break;
              }
            }
          }
        } catch (e) {
          console.error('Webhook check error:', e);
        }

        // Get lead forms
        let forms: Array<{ id: string; name: string; status: string }> = [];
        try {
          const formsUrl = `https://graph.facebook.com/v21.0/${targetPageId}/leadgen_forms?fields=id,name,status&access_token=${tokenToUse}`;
          const formsRes = await fetch(formsUrl);
          const formsData = await formsRes.json();
          if (formsData.data) {
            forms = formsData.data.map((f: any) => ({
              id: f.id,
              name: f.name || 'Unnamed Form',
              status: f.status || 'UNKNOWN',
            }));
          }
        } catch (e) {
          console.error('Forms check error:', e);
        }

        return new Response(JSON.stringify({ webhookActive, leadgenSubscribed, forms }), {
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
