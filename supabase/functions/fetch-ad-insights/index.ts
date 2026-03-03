import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InsightData {
  campaign_id: string
  campaign_name: string
  impressions: string
  clicks: string
  reach: string
  spend: string
  cpc: string
  ctr: string
  actions?: Array<{ action_type: string; value: string }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get organization's Facebook tokens
    const { data: org } = await supabase
      .from('organizations')
      .select('fb_user_access_token, fb_ad_account_id, fb_page_access_token')
      .eq('id', profile.organization_id)
      .single()

    if (!org?.fb_user_access_token || !org?.fb_ad_account_id) {
      return new Response(JSON.stringify({ 
        error: 'Facebook not connected or no ad account configured',
        campaigns: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = org.fb_user_access_token
    const adAccountId = org.fb_ad_account_id.startsWith('act_') 
      ? org.fb_ad_account_id 
      : `act_${org.fb_ad_account_id}`

    // Parse request body for date range
    let datePreset = 'last_30d'
    try {
      const body = await req.json()
      if (body?.datePreset) datePreset = body.datePreset
    } catch {
      // Use default
    }

    // Fetch campaign-level insights from Facebook Graph API v21.0
    const fields = 'campaign_id,campaign_name,impressions,clicks,reach,spend,cpc,ctr,actions'
    const insightsUrl = `https://graph.facebook.com/v21.0/${adAccountId}/insights?fields=${fields}&level=campaign&date_preset=${datePreset}&limit=50&access_token=${accessToken}`

    console.log(`Fetching ad insights for ${adAccountId} with date_preset=${datePreset}`)

    const fbResponse = await fetch(insightsUrl)
    const fbData = await fbResponse.json()

    if (fbData.error) {
      console.error('Facebook API error:', fbData.error)
      return new Response(JSON.stringify({ 
        error: fbData.error.message || 'Facebook API error',
        errorCode: fbData.error.code,
        campaigns: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Transform the data
    const campaigns = (fbData.data || []).map((insight: InsightData) => {
      const conversions = insight.actions?.find(
        (a) => a.action_type === 'offsite_conversion.fb_pixel_lead' || a.action_type === 'lead'
      )

      return {
        campaign_id: insight.campaign_id,
        campaign_name: insight.campaign_name,
        impressions: parseInt(insight.impressions || '0'),
        clicks: parseInt(insight.clicks || '0'),
        reach: parseInt(insight.reach || '0'),
        spend: parseFloat(insight.spend || '0'),
        cpc: parseFloat(insight.cpc || '0'),
        ctr: parseFloat(insight.ctr || '0'),
        conversions: parseInt(conversions?.value || '0'),
      }
    })

    console.log(`Successfully fetched ${campaigns.length} campaign insights`)

    return new Response(JSON.stringify({ campaigns }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in fetch-ad-insights:', error)
    return new Response(JSON.stringify({ error: error.message, campaigns: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
