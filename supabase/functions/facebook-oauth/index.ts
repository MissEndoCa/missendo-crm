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

// Required permissions for Facebook Lead Ads
const REQUIRED_PERMISSIONS = [
  'pages_show_list',
  'pages_read_engagement', 
  'leads_retrieval',
  'pages_manage_metadata'
];

// Helper function to check user permissions
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

// Helper function to fetch pages with fallback methods
async function fetchUserPages(accessToken: string): Promise<{
  pages: Array<{ id: string; name: string; access_token?: string }>;
  error?: string;
  debugInfo?: any;
}> {
  // Method 1: Standard me/accounts endpoint
  console.log('Attempting to fetch pages via me/accounts...');
  const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,category,tasks`;
  const pagesRes = await fetch(pagesUrl);
  const pagesData = await pagesRes.json();

  console.log('me/accounts full response:', JSON.stringify(pagesData, null, 2));

  if (pagesData.error) {
    console.error('me/accounts error:', pagesData.error);
    return { 
      pages: [], 
      error: pagesData.error.message,
      debugInfo: { method: 'me/accounts', error: pagesData.error }
    };
  }

  if (pagesData.data && pagesData.data.length > 0) {
    console.log('Found', pagesData.data.length, 'pages via me/accounts');
    return { 
      pages: pagesData.data,
      debugInfo: { method: 'me/accounts', count: pagesData.data.length }
    };
  }

  // Method 2: Try via businesses endpoint (for business accounts)
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
          allPages.push({
            id: page.id,
            name: page.name,
            access_token: page.access_token
          });
        }
      }
    }

    if (allPages.length > 0) {
      console.log('Found', allPages.length, 'pages via businesses endpoint');
      return { 
        pages: allPages,
        debugInfo: { method: 'businesses', count: allPages.length }
      };
    }
  }

  // Method 3: Check if user has any page roles
  console.log('Checking user page roles...');
  const userUrl = `https://graph.facebook.com/v21.0/me?access_token=${accessToken}&fields=id,name`;
  const userRes = await fetch(userUrl);
  const userData = await userRes.json();

  console.log('User info:', JSON.stringify(userData, null, 2));

  return { 
    pages: [],
    debugInfo: {
      method: 'all_failed',
      userId: userData?.id,
      userName: userData?.name,
      accountsResponse: pagesData,
      businessesResponse: businessesData
    }
  };
}

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
        const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${accessToken}`;
        
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

        // Check permissions after token exchange
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
        // Check current token permissions
        const { longLivedToken } = body;
        
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const permissionCheck = await checkUserPermissions(longLivedToken);

        return new Response(JSON.stringify({ 
          permissions: permissionCheck,
          requiredPermissions: REQUIRED_PERMISSIONS
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

        // First check permissions
        const permissionCheck = await checkUserPermissions(longLivedToken);
        
        // Check for critical missing permissions
        const criticalMissing = ['pages_show_list', 'pages_read_engagement'].filter(
          p => permissionCheck.missing.includes(p)
        );

        if (criticalMissing.length > 0) {
          console.warn('Missing critical permissions:', criticalMissing);
        }

        // Fetch pages with fallback methods
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

          console.error('No pages found:', {
            errorCode,
            permissions: permissionCheck,
            debugInfo: pagesResult.debugInfo
          });

          return new Response(JSON.stringify({ 
            pages: [],
            error: errorMessage,
            errorCode,
            permissions: permissionCheck,
            debugInfo: pagesResult.debugInfo
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Return pages without exposing tokens to frontend
        const pages = pagesResult.pages.map((page: any) => ({
          id: page.id,
          name: page.name,
        }));

        console.log('Successfully returning', pages.length, 'pages');

        return new Response(JSON.stringify({ 
          pages,
          permissions: permissionCheck 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'adaccounts': {
        // Get ad accounts accessible to the user
        const { longLivedToken } = body;
        
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const adAccountsUrl = `https://graph.facebook.com/v21.0/me/adaccounts?access_token=${longLivedToken}&fields=id,name,account_id,account_status&limit=100`;
        const adAccountsRes = await fetch(adAccountsUrl);
        const adAccountsData = await adAccountsRes.json();

        if (adAccountsData.error) {
          console.error('Ad accounts fetch error:', adAccountsData.error);
          // ads_read permission may not be granted — return empty list instead of error
          return new Response(JSON.stringify({ 
            adAccounts: [],
            error: adAccountsData.error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const adAccounts = (adAccountsData.data || []).map((acc: any) => ({
          id: acc.id,            // e.g. "act_123456"
          name: acc.name,
          accountId: acc.account_id,  // e.g. "123456"
          status: acc.account_status, // 1=ACTIVE, 2=DISABLED, etc.
        }));

        console.log('Found', adAccounts.length, 'ad accounts');

        return new Response(JSON.stringify({ adAccounts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'campaigns': {
        // Get campaigns for a specific ad account (or from DB-stored ad account)
        const { longLivedToken, adAccountId } = body;
        
        if (!longLivedToken) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Determine which ad account to use
        let targetAdAccountId = adAccountId;

        // If no adAccountId provided, try to get it from the DB
        if (!targetAdAccountId) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('fb_ad_account_id')
            .eq('id', profile.organization_id)
            .single();
          
          targetAdAccountId = orgData?.fb_ad_account_id;
        }

        if (!targetAdAccountId) {
          console.log('No ad account ID specified, returning empty campaigns');
          return new Response(JSON.stringify({ campaigns: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Fetching campaigns for ad account:', targetAdAccountId);

        const campaignsUrl = `https://graph.facebook.com/v21.0/${targetAdAccountId}/campaigns?access_token=${longLivedToken}&fields=id,name,status,objective&limit=100`;
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
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              adAccountId: targetAdAccountId
            });
          }
        }

        console.log('Found', allCampaigns.length, 'lead/active campaigns for', targetAdAccountId);

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
          const adsetsUrl = `https://graph.facebook.com/v21.0/${campaignId}/adsets?access_token=${longLivedToken}&fields=id,name,status&limit=100`;
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
        // Connect a specific page with ad account and optional campaign/adset filters
        const { longLivedToken, pageId, pageName, fbUserId, selectedAdAccountId, selectedCampaigns, selectedAdsets } = body;
        
        if (!longLivedToken || !pageId) {
          return new Response(JSON.stringify({ error: 'Token and page ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Fetch pages with the enhanced method to get page access token
        const pagesResult = await fetchUserPages(longLivedToken);

        if (pagesResult.error) {
          console.error('Pages fetch error during connect:', pagesResult.error);
          return new Response(JSON.stringify({ error: pagesResult.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const selectedPage = pagesResult.pages.find((p: any) => p.id === pageId);
        if (!selectedPage) {
          return new Response(JSON.stringify({ 
            error: 'Page not found or access denied. Make sure you are an admin on the page.',
            errorCode: 'PAGE_NOT_FOUND'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const pageAccessToken = selectedPage.access_token;
        
        if (!pageAccessToken) {
          console.error('No page access token available for page:', pageId);
          return new Response(JSON.stringify({ 
            error: 'Could not retrieve page access token. Please check your Facebook permissions.',
            errorCode: 'NO_PAGE_TOKEN'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Got page access token for:', selectedPage.name);

        // Subscribe to leadgen webhook
        const subscribeUrl = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`;
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
        }

        // Save to database with ad account and campaign/adset selections
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            fb_page_access_token: pageAccessToken,
            fb_user_access_token: longLivedToken,
            fb_page_id: pageId,
            fb_page_name: pageName || selectedPage.name,
            fb_connected_at: new Date().toISOString(),
            fb_user_id: fbUserId || null,
            fb_ad_account_id: selectedAdAccountId || null,
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
        console.log('Ad account:', selectedAdAccountId, 'Selected campaigns:', selectedCampaigns?.length || 0, 'Selected adsets:', selectedAdsets?.length || 0);

        return new Response(JSON.stringify({ 
          success: true,
          pageName: selectedPage.name,
          pageId: pageId,
          adAccountId: selectedAdAccountId,
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
          .select('fb_selected_campaigns, fb_selected_adsets, fb_page_access_token, fb_ad_account_id')
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
          adAccountId: orgData?.fb_ad_account_id || null,
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
            fb_user_access_token: null,
            fb_page_id: null,
            fb_page_name: null,
            fb_connected_at: null,
            fb_user_id: null,
            fb_ad_account_id: null,
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
