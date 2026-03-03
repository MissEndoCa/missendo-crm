import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Facebook, Check, X, Loader2, AlertCircle, ChevronRight, Filter, Settings2, ExternalLink, AlertTriangle, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FB_APP_ID = '1722864942230149';

interface FacebookPage { id: string; name: string; }
interface AdAccount { id: string; name: string; accountId: string; status: number; }
interface Campaign { id: string; name: string; status: string; adAccountId: string; }
interface Adset { id: string; name: string; status: string; campaignId: string; }
interface SelectedItem { id: string; name: string; }
interface ConnectionStatus {
  connected: boolean; pageName: string | null; pageId: string | null;
  connectedAt: string | null; selectedCampaigns: SelectedItem[]; selectedAdsets: SelectedItem[];
}
interface PermissionCheck { granted: string[]; declined: string[]; missing: string[]; }

declare global { interface Window { FB: any; fbAsyncInit: () => void; } }

export function FacebookConnectButton() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false, pageName: null, pageId: null, connectedAt: null,
    selectedCampaigns: [], selectedAdsets: [],
  });

  const [longLivedToken, setLongLivedToken] = useState<string | null>(null);
  const [fbUserId, setFbUserId] = useState<string | null>(null);

  // Ad Account selection (Step 1)
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [showAdAccountDialog, setShowAdAccountDialog] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState<AdAccount | null>(null);
  const [loadingAdAccounts, setLoadingAdAccounts] = useState(false);

  // Page selection (Step 2)
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);

  // Campaign/Adset selection (Step 3)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adsets, setAdsets] = useState<Adset[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<SelectedItem[]>([]);
  const [selectedAdsets, setSelectedAdsets] = useState<SelectedItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingAdsets, setLoadingAdsets] = useState(false);

  // Filter & Permission state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [permissionInfo, setPermissionInfo] = useState<PermissionCheck | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadConnectionStatus = useCallback(async () => {
    if (!profile?.organization_id) return;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('fb_page_id, fb_page_name, fb_connected_at, fb_selected_campaigns, fb_selected_adsets')
        .eq('id', profile.organization_id).single();
      if (error) throw error;
      setConnectionStatus({
        connected: !!data?.fb_page_id, pageName: data?.fb_page_name || null,
        pageId: data?.fb_page_id || null, connectedAt: data?.fb_connected_at || null,
        selectedCampaigns: (data?.fb_selected_campaigns as unknown as SelectedItem[]) || [],
        selectedAdsets: (data?.fb_selected_adsets as unknown as SelectedItem[]) || [],
      });
    } catch (error) { console.error('Error loading connection status:', error); }
  }, [profile?.organization_id]);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) { setSdkLoaded(true); return; }
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
    if (existingScript) {
      const checkFB = setInterval(() => {
        if (window.FB) {
          window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: true, version: 'v19.0' });
          setSdkLoaded(true); clearInterval(checkFB);
        }
      }, 100);
      setTimeout(() => clearInterval(checkFB), 10000);
      return;
    }
    window.fbAsyncInit = function() {
      window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: true, version: 'v19.0' });
      setSdkLoaded(true);
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true; script.defer = true; script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, []);

  useEffect(() => { loadConnectionStatus(); }, [loadConnectionStatus]);

  // ---- STEP 0: Facebook Login → fetch ad accounts ----
  const handleFacebookLogin = () => {
    if (!sdkLoaded || !window.FB) {
      toast({ title: 'Error', description: 'Facebook SDK is loading, please wait...', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const loginTimeout = window.setTimeout(() => {
      setLoading(false);
      toast({ title: 'Facebook window could not be opened', description: 'The popup may be blocked.', variant: 'destructive' });
    }, 20000);

    try {
      window.FB.login((response: any) => {
        void (async () => {
          window.clearTimeout(loginTimeout);
          if (response?.authResponse) {
            const { accessToken, userID } = response.authResponse;
            setFbUserId(userID);
            try {
              const { data: session } = await supabase.auth.getSession();
              if (!session?.session?.access_token) throw new Error('Not authenticated');

              // Exchange token
              const exchangeRes = await supabase.functions.invoke('facebook-oauth', {
                body: { action: 'exchange', accessToken },
              });
              if (exchangeRes.error) throw new Error(exchangeRes.error.message || 'Token exchange failed');
              const { longLivedToken: token, permissions } = exchangeRes.data;
              setLongLivedToken(token);
              if (permissions?.missing?.length > 0 || permissions?.declined?.length > 0) {
                setPermissionInfo(permissions);
              }

              // Fetch ad accounts first
              const adAccountsRes = await supabase.functions.invoke('facebook-oauth', {
                body: { action: 'adaccounts', longLivedToken: token },
              });

              const accounts: AdAccount[] = adAccountsRes.data?.adAccounts || [];

              if (accounts.length === 0) {
                // No ad accounts — go directly to pages (all pages)
                await fetchAndShowPages(token, null);
              } else if (accounts.length === 1) {
                // Single ad account — auto-select, show pages filtered by it
                setSelectedAdAccount(accounts[0]);
                await fetchAndShowPages(token, accounts[0]);
              } else {
                // Multiple ad accounts — show selection dialog
                setAdAccounts(accounts);
                setShowAdAccountDialog(true);
              }
            } catch (error: any) {
              console.error('Facebook connect error:', error);
              toast({ title: 'Connection Error', description: error.message || 'Failed to connect', variant: 'destructive' });
            }
          } else {
            toast({ title: 'Cancelled', description: 'Facebook login was cancelled or permissions were denied.', variant: 'destructive' });
          }
          setLoading(false);
        })();
      }, {
        scope: 'pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata,ads_read',
        return_scopes: true, auth_type: 'rerequest', display: 'popup',
      });
    } catch (e) {
      window.clearTimeout(loginTimeout);
      setLoading(false);
      toast({ title: 'Could not start Facebook login', description: 'Browser may be blocking the popup.', variant: 'destructive' });
    }
  };

  // ---- STEP 1: Ad Account Selected → fetch pages ----
  const handleAdAccountSelect = async (adAccount: AdAccount) => {
    setSelectedAdAccount(adAccount);
    setShowAdAccountDialog(false);
    await fetchAndShowPages(longLivedToken!, adAccount);
  };

  const fetchAndShowPages = async (token: string, adAccount: AdAccount | null) => {
    setLoadingPages(true);
    setShowPageDialog(true);

    try {
      let pagesRes;
      if (adAccount) {
        // Fetch pages filtered by ad account
        pagesRes = await supabase.functions.invoke('facebook-oauth', {
          body: { action: 'pages-by-adaccount', longLivedToken: token, adAccountId: adAccount.id },
        });
      } else {
        // Fetch all pages
        pagesRes = await supabase.functions.invoke('facebook-oauth', {
          body: { action: 'pages', longLivedToken: token },
        });
      }

      if (pagesRes.error) throw new Error(pagesRes.error.message || 'Failed to fetch pages');

      const { pages: userPages, error: pagesError, errorCode: pagesErrorCode, permissions: pagesPermissions } = pagesRes.data;

      if (!userPages || userPages.length === 0) {
        setShowPageDialog(false);
        setPermissionInfo(pagesPermissions || permissionInfo);
        setErrorCode(pagesErrorCode || 'NO_PAGES');
        setShowPermissionError(true);
        return;
      }

      setPages(userPages);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      setShowPageDialog(false);
      toast({ title: 'Error', description: error.message || 'Failed to fetch pages', variant: 'destructive' });
    } finally {
      setLoadingPages(false);
    }
  };

  // ---- STEP 2: Page Selected → fetch campaigns ----
  const handlePageSelect = async (page: FacebookPage) => {
    setSelectedPage(page);
    setShowPageDialog(false);
    setLoadingCampaigns(true);
    setShowCampaignDialog(true);

    try {
      const campaignsRes = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'campaigns', longLivedToken, adAccountId: selectedAdAccount?.id },
      });
      if (campaignsRes.error) {
        console.error('Campaigns fetch error:', campaignsRes.error);
        setCampaigns([]);
      } else {
        setCampaigns(campaignsRes.data?.campaigns || []);
      }
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // ---- Campaign & Adset toggles ----
  const handleCampaignToggle = async (campaign: Campaign) => {
    const isSelected = selectedCampaigns.some(c => c.id === campaign.id);
    let newSelectedCampaigns: SelectedItem[];
    if (isSelected) {
      newSelectedCampaigns = selectedCampaigns.filter(c => c.id !== campaign.id);
      setSelectedAdsets(prev => prev.filter(a => {
        const adset = adsets.find(ad => ad.id === a.id);
        return adset?.campaignId !== campaign.id;
      }));
    } else {
      newSelectedCampaigns = [...selectedCampaigns, { id: campaign.id, name: campaign.name }];
    }
    setSelectedCampaigns(newSelectedCampaigns);

    if (!isSelected && longLivedToken) {
      setLoadingAdsets(true);
      try {
        const adsetsRes = await supabase.functions.invoke('facebook-oauth', {
          body: { action: 'adsets', longLivedToken, campaignIds: [campaign.id] },
        });
        if (!adsetsRes.error && adsetsRes.data?.adsets) {
          setAdsets(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            return [...prev, ...adsetsRes.data.adsets.filter((a: Adset) => !existingIds.has(a.id))];
          });
        }
      } catch (error) { console.error('Error fetching adsets:', error); }
      finally { setLoadingAdsets(false); }
    }
  };

  const handleAdsetToggle = (adset: Adset) => {
    const isSelected = selectedAdsets.some(a => a.id === adset.id);
    if (isSelected) {
      setSelectedAdsets(prev => prev.filter(a => a.id !== adset.id));
    } else {
      setSelectedAdsets(prev => [...prev, { id: adset.id, name: adset.name }]);
    }
  };

  // ---- Complete Connection ----
  const handleCompleteConnection = async () => {
    if (!longLivedToken || !selectedPage) return;
    setLoading(true);
    setShowCampaignDialog(false);

    try {
      const connectRes = await supabase.functions.invoke('facebook-oauth', {
        body: {
          action: 'connect', longLivedToken,
          pageId: selectedPage.id, pageName: selectedPage.name, fbUserId,
          selectedAdAccountId: selectedAdAccount?.id || null,
          selectedCampaigns, selectedAdsets,
        },
      });
      if (connectRes.error) throw new Error(connectRes.error.message || 'Connection failed');

      const adAccountInfo = selectedAdAccount ? ` Ad Account: ${selectedAdAccount.name}.` : '';
      const filterInfo = selectedCampaigns.length > 0
        ? ` ${selectedCampaigns.length} campaign(s) and ${selectedAdsets.length} ad set(s) selected.`
        : ' All leads will be synced.';

      toast({
        title: 'Connection Successful! 🎉',
        description: `${selectedPage.name} page has been connected.${adAccountInfo}${filterInfo}`,
      });
      await loadConnectionStatus();
      resetState();
    } catch (error: any) {
      console.error('Page connect error:', error);
      toast({ title: 'Connection Error', description: error.message || 'Failed to connect', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  // ---- Filter Dialog ----
  const handleOpenFilterDialog = async () => {
    setShowFilterDialog(true);
    setLoadingCampaigns(true);
    setSelectedCampaigns(connectionStatus.selectedCampaigns);
    setSelectedAdsets(connectionStatus.selectedAdsets);
    try {
      const filtersRes = await supabase.functions.invoke('facebook-oauth', { body: { action: 'get-filters' } });
      if (filtersRes.error || !filtersRes.data?.hasToken) {
        toast({ title: 'Error', description: 'Could not retrieve campaign information. Please reconnect.', variant: 'destructive' });
        setShowFilterDialog(false); return;
      }
      setCampaigns([]); setAdsets([]);
    } catch (error) { console.error('Error loading filters:', error); }
    finally { setLoadingCampaigns(false); }
  };

  const handleUpdateFilters = async () => {
    setLoading(true);
    try {
      const updateRes = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'update-filters', selectedCampaigns, selectedAdsets },
      });
      if (updateRes.error) throw new Error(updateRes.error.message || 'Update failed');
      toast({ title: 'Filters Updated', description: `${selectedCampaigns.length} campaign(s) and ${selectedAdsets.length} ad set(s) selected.` });
      await loadConnectionStatus();
      setShowFilterDialog(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update filters', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Facebook?')) return;
    setLoading(true);
    try {
      const disconnectRes = await supabase.functions.invoke('facebook-oauth', { body: { action: 'disconnect' } });
      if (disconnectRes.error) throw new Error(disconnectRes.error.message || 'Disconnect failed');
      toast({ title: 'Disconnected', description: 'Facebook page connection has been removed.' });
      setConnectionStatus({ connected: false, pageName: null, pageId: null, connectedAt: null, selectedCampaigns: [], selectedAdsets: [] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to disconnect', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const resetState = () => {
    setLongLivedToken(null); setFbUserId(null);
    setAdAccounts([]); setSelectedAdAccount(null);
    setPages([]); setSelectedPage(null);
    setCampaigns([]); setAdsets([]);
    setSelectedCampaigns([]); setSelectedAdsets([]);
    setPermissionInfo(null); setErrorCode(null);
  };

  const getSelectedCampaignAdsets = () => {
    const ids = new Set(selectedCampaigns.map(c => c.id));
    return adsets.filter(a => ids.has(a.campaignId));
  };

  const getPermissionErrorMessage = () => {
    if (!permissionInfo) return { title: 'Page Not Found', description: 'No Facebook page was found where you are an administrator.' };
    if (permissionInfo.declined.length > 0) return { title: 'Permissions Declined', description: `Declined: ${permissionInfo.declined.join(', ')}` };
    if (permissionInfo.missing.length > 0) return { title: 'Missing Permissions', description: `Missing: ${permissionInfo.missing.join(', ')}` };
    return { title: 'Page Not Found', description: 'Make sure you are a page administrator in Meta Business Suite.' };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-primary" />
            Facebook Lead Ads
          </CardTitle>
          <CardDescription>Connect your Facebook page to automatically sync leads into your CRM</CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <Check className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-success">Connected: {connectionStatus.pageName}</p>
                  {connectionStatus.connectedAt && (
                    <p className="text-sm text-success/80">Connected on: {format(new Date(connectionStatus.connectedAt), 'MMMM d, yyyy')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted/50 border rounded-lg">
                <Filter className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  {connectionStatus.selectedCampaigns.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{connectionStatus.selectedCampaigns.length} Campaign(s) Selected</p>
                      <div className="flex flex-wrap gap-1">
                        {connectionStatus.selectedCampaigns.slice(0, 3).map(c => (
                          <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>
                        ))}
                        {connectionStatus.selectedCampaigns.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{connectionStatus.selectedCampaigns.length - 3} more</Badge>
                        )}
                      </div>
                      {connectionStatus.selectedAdsets.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{connectionStatus.selectedAdsets.length} Ad Set(s) selected</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Receiving leads from all campaigns</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleOpenFilterDialog} disabled={loading}>
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={handleDisconnect} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">Connect with Facebook to automatically sync contacts from your lead forms into the CRM.</p>
              </div>
              <Button onClick={handleFacebookLogin} disabled={loading || !sdkLoaded} className="w-full" style={{ backgroundColor: '#1877F2' }}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Facebook className="w-4 h-4 mr-2" />}
                {!sdkLoaded ? 'Loading...' : 'Connect with Facebook'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Ad Account Selection Dialog */}
      <Dialog open={showAdAccountDialog} onOpenChange={(open) => { setShowAdAccountDialog(open); if (!open) resetState(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Select Ad Account</DialogTitle>
            <DialogDescription>Choose the ad account you want to use for lead tracking and ad performance</DialogDescription>
          </DialogHeader>
          {loadingAdAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading ad accounts...</span>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {adAccounts.map((account) => (
                <Button key={account.id} variant="outline" className="w-full justify-between h-auto py-3" onClick={() => handleAdAccountSelect(account)} disabled={loading}>
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-3 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {account.accountId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={account.status === 1 ? 'default' : 'secondary'} className="text-xs">
                      {account.status === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Button>
              ))}
              <Button variant="ghost" className="w-full justify-center h-auto py-3 text-muted-foreground"
                onClick={async () => { setShowAdAccountDialog(false); await fetchAndShowPages(longLivedToken!, null); }}>
                Skip — show all pages without ad account filtering
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 2: Page Selection Dialog */}
      <Dialog open={showPageDialog} onOpenChange={(open) => { setShowPageDialog(open); if (!open) resetState(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Page</DialogTitle>
            <DialogDescription>
              {selectedAdAccount
                ? `Showing pages linked to ${selectedAdAccount.name}. Choose the page from which leads will be synced.`
                : 'Choose the Facebook page from which leads will be synced'}
            </DialogDescription>
          </DialogHeader>
          {loadingPages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading pages...</span>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {pages.map((page) => (
                <Button key={page.id} variant="outline" className="w-full justify-between h-auto py-3" onClick={() => handlePageSelect(page)} disabled={loading}>
                  <div className="flex items-center">
                    <Facebook className="w-4 h-4 mr-3 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{page.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 3: Campaign & Adset Selection Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={(open) => { setShowCampaignDialog(open); if (!open) resetState(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Campaign & Ad Set Selection</DialogTitle>
            <DialogDescription>
              {selectedAdAccount
                ? `Select campaigns from ${selectedAdAccount.name} for the ${selectedPage?.name} page.`
                : `Select which campaigns to receive leads from for the ${selectedPage?.name} page.`}
              {' '}If you don't select any, all leads will be synced.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No Lead Generation campaigns found.<br /><span className="text-sm">All leads will be synced automatically.</span></p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Filter className="w-4 h-4" /> Campaigns ({campaigns.length})</h4>
                  <div className="space-y-2">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleCampaignToggle(campaign)}>
                        <Checkbox checked={selectedCampaigns.some(c => c.id === campaign.id)} onCheckedChange={() => handleCampaignToggle(campaign)} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {campaign.id}</p>
                        </div>
                        <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedCampaigns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Filter className="w-4 h-4" /> Ad Sets {loadingAdsets && <Loader2 className="w-4 h-4 animate-spin" />}</h4>
                    {getSelectedCampaignAdsets().length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">{loadingAdsets ? 'Loading...' : 'No ad sets found or all will be included.'}</p>
                    ) : (
                      <div className="space-y-2">
                        {getSelectedCampaignAdsets().map((adset) => (
                          <div key={adset.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ml-4" onClick={() => handleAdsetToggle(adset)}>
                            <Checkbox checked={selectedAdsets.some(a => a.id === adset.id)} onCheckedChange={() => handleAdsetToggle(adset)} />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{adset.name}</p>
                              <p className="text-xs text-muted-foreground">Campaign: {campaigns.find(c => c.id === adset.campaignId)?.name}</p>
                            </div>
                            <Badge variant={adset.status === 'ACTIVE' ? 'default' : 'secondary'}>{adset.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedCampaigns.length > 0 ? `${selectedCampaigns.length} campaign(s), ${selectedAdsets.length} ad set(s) selected` : 'All leads will be synced'}
            </div>
            <Button variant="outline" onClick={() => { setShowCampaignDialog(false); resetState(); }}>Cancel</Button>
            <Button onClick={handleCompleteConnection} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Complete Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Management Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Campaign Filters</DialogTitle>
            <DialogDescription>Update your current campaign and ad set selections.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Campaigns</p>
              {selectedCampaigns.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedCampaigns.map(c => (
                    <Badge key={c.id} variant="secondary" className="cursor-pointer" onClick={() => setSelectedCampaigns(prev => prev.filter(p => p.id !== c.id))}>{c.name} ×</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">All campaigns</p>}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Ad Sets</p>
              {selectedAdsets.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedAdsets.map(a => (
                    <Badge key={a.id} variant="secondary" className="cursor-pointer" onClick={() => setSelectedAdsets(prev => prev.filter(p => p.id !== a.id))}>{a.name} ×</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">All ad sets</p>}
            </div>
            <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">You may need to reconnect to Facebook to add new campaigns.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateFilters} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Error Dialog */}
      <Dialog open={showPermissionError} onOpenChange={(open) => { setShowPermissionError(open); if (!open) resetState(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> {getPermissionErrorMessage().title}
            </DialogTitle>
            <DialogDescription>{getPermissionErrorMessage().description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>What Should You Do?</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>1. Go to <strong>Meta Business Suite</strong></p>
                <p>2. Verify that you have an <strong>admin</strong> role on the relevant page</p>
                <p>3. Check this app's permissions under Facebook &gt; Settings &gt; Apps</p>
              </AlertDescription>
            </Alert>
            {permissionInfo && (
              <div className="space-y-2">
                {permissionInfo.granted.length > 0 && (
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-sm font-medium text-success mb-1">✓ Granted Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {permissionInfo.granted.map(p => <Badge key={p} variant="outline" className="text-xs text-success border-success">{p}</Badge>)}
                    </div>
                  </div>
                )}
                {permissionInfo.missing.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">✗ Missing Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {permissionInfo.missing.map(p => <Badge key={p} variant="outline" className="text-xs text-destructive border-destructive">{p}</Badge>)}
                    </div>
                  </div>
                )}
                {permissionInfo.declined.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">✗ Declined Permissions</p>
                    <div className="flex flex-wrap gap-1">
                      {permissionInfo.declined.map(p => <Badge key={p} variant="outline" className="text-xs text-destructive border-destructive">{p}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.open('https://business.facebook.com/settings/pages', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" /> Meta Business Suite
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.open(`https://www.facebook.com/settings?tab=applications&app_id=${FB_APP_ID}`, '_blank')}>
              <Settings2 className="w-4 h-4 mr-2" /> App Permissions
            </Button>
            <Button onClick={() => { setShowPermissionError(false); resetState(); handleFacebookLogin(); }}>Try Again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
