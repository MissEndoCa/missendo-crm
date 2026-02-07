import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Facebook, Check, X, Loader2, AlertCircle, ChevronRight, Filter, Settings2, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Facebook App ID (public, safe to expose)
const FB_APP_ID = '1722864942230149';

interface FacebookPage {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  adAccountId: string;
}

interface Adset {
  id: string;
  name: string;
  status: string;
  campaignId: string;
}

interface SelectedItem {
  id: string;
  name: string;
}

interface ConnectionStatus {
  connected: boolean;
  pageName: string | null;
  pageId: string | null;
  connectedAt: string | null;
  selectedCampaigns: SelectedItem[];
  selectedAdsets: SelectedItem[];
}

interface PermissionCheck {
  granted: string[];
  declined: string[];
  missing: string[];
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookConnectButton() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    pageName: null,
    pageId: null,
    connectedAt: null,
    selectedCampaigns: [],
    selectedAdsets: [],
  });
  
  // Page selection state
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [longLivedToken, setLongLivedToken] = useState<string | null>(null);
  const [fbUserId, setFbUserId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  
  // Campaign/Adset selection state
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adsets, setAdsets] = useState<Adset[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<SelectedItem[]>([]);
  const [selectedAdsets, setSelectedAdsets] = useState<SelectedItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingAdsets, setLoadingAdsets] = useState(false);
  
  // Filter management dialog
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Permission error state
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [permissionInfo, setPermissionInfo] = useState<PermissionCheck | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Load connection status
  const loadConnectionStatus = useCallback(async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('fb_page_id, fb_page_name, fb_connected_at, fb_selected_campaigns, fb_selected_adsets')
        .eq('id', profile.organization_id)
        .single();

      if (error) throw error;

      setConnectionStatus({
        connected: !!data?.fb_page_id,
        pageName: data?.fb_page_name || null,
        pageId: data?.fb_page_id || null,
        connectedAt: data?.fb_connected_at || null,
        selectedCampaigns: (data?.fb_selected_campaigns as unknown as SelectedItem[]) || [],
        selectedAdsets: (data?.fb_selected_adsets as unknown as SelectedItem[]) || [],
      });
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  }, [profile?.organization_id]);

  // Load Facebook SDK
  useEffect(() => {
    // Check if SDK is already loaded
    if (window.FB) {
      console.log('Facebook SDK already loaded');
      setSdkLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
    if (existingScript) {
      console.log('Facebook SDK script already exists, waiting for load...');
      // Wait for it to load
      const checkFB = setInterval(() => {
        if (window.FB) {
          console.log('Facebook SDK loaded via existing script');
          window.FB.init({
            appId: FB_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v19.0'
          });
          setSdkLoaded(true);
          clearInterval(checkFB);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => clearInterval(checkFB), 10000);
      return;
    }

    window.fbAsyncInit = function() {
      console.log('Facebook SDK fbAsyncInit called');
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      setSdkLoaded(true);
    };

    // Load SDK script
    console.log('Loading Facebook SDK script...');
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      console.log('Facebook SDK script onload fired');
    };
    script.onerror = (e) => {
      console.error('Facebook SDK script failed to load:', e);
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    loadConnectionStatus();
  }, [loadConnectionStatus]);

  const handleFacebookLogin = () => {
    if (!sdkLoaded || !window.FB) {
      toast({
        title: 'Hata',
        description: 'Facebook SDK yükleniyor, lütfen bekleyin...',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting FB.login...');
    setLoading(true);

    const loginTimeout = window.setTimeout(() => {
      console.warn('FB.login timed out - possible popup block');
      setLoading(false);
      toast({
        title: 'Facebook penceresi açılamadı',
        description:
          'Popup engellenmiş olabilir. Tarayıcı adres çubuğundaki popup engelleme ikonundan izin verip tekrar deneyin.',
        variant: 'destructive',
      });
    }, 20000);

    try {
      window.FB.login(
        (response: any) => {
          void (async () => {
            window.clearTimeout(loginTimeout);
            console.log('FB.login callback response:', response);

            if (response?.authResponse) {
              const { accessToken, userID } = response.authResponse;
              setFbUserId(userID);

              try {
                // Exchange for long-lived token
                const { data: session } = await supabase.auth.getSession();
                if (!session?.session?.access_token) {
                  throw new Error('Not authenticated');
                }

                const exchangeRes = await supabase.functions.invoke('facebook-oauth', {
                  body: { action: 'exchange', accessToken },
                });

                if (exchangeRes.error) {
                  throw new Error(exchangeRes.error.message || 'Token exchange failed');
                }

                const { longLivedToken: token, permissions } = exchangeRes.data;
                setLongLivedToken(token);

                // Check for permission issues
                if (permissions?.missing?.length > 0 || permissions?.declined?.length > 0) {
                  console.warn('Permission issues detected:', permissions);
                  setPermissionInfo(permissions);
                }

                // Get pages
                const pagesRes = await supabase.functions.invoke('facebook-oauth', {
                  body: { action: 'pages', longLivedToken: token },
                });

                if (pagesRes.error) {
                  throw new Error(pagesRes.error.message || 'Failed to fetch pages');
                }

                const { pages: userPages, error: pagesError, errorCode: pagesErrorCode, permissions: pagesPermissions } = pagesRes.data;

                if (!userPages || userPages.length === 0) {
                  // Show detailed error dialog
                  setPermissionInfo(pagesPermissions || permissions);
                  setErrorCode(pagesErrorCode || 'NO_PAGES');
                  setShowPermissionError(true);
                  setLoading(false);
                  return;
                }

                setPages(userPages);
                setShowPageDialog(true);
              } catch (error: any) {
                console.error('Facebook connect error:', error);
                toast({
                  title: 'Bağlantı Hatası',
                  description: error.message || 'Facebook bağlantısı kurulamadı',
                  variant: 'destructive',
                });
              }
            } else {
              toast({
                title: 'İptal Edildi',
                description: 'Facebook girişi iptal edildi veya izinler reddedildi.',
                variant: 'destructive',
              });
            }
            setLoading(false);
          })();
        },
        {
          scope: 'pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata,ads_read',
          return_scopes: true,
          auth_type: 'rerequest',
          display: 'popup',
        }
      );
    } catch (e) {
      window.clearTimeout(loginTimeout);
      console.error('FB.login threw error:', e);
      setLoading(false);
      toast({
        title: 'Facebook girişi başlatılamadı',
        description: 'Tarayıcı güvenlik ayarları / reklam engelleyici Facebook popupını engelliyor olabilir.',
        variant: 'destructive',
      });
    }
  };

  const handlePageSelect = async (page: FacebookPage) => {
    setSelectedPage(page);
    setShowPageDialog(false);
    setLoadingCampaigns(true);
    setShowCampaignDialog(true);

    try {
      // Fetch campaigns
      const campaignsRes = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'campaigns', longLivedToken, pageId: page.id },
      });

      if (campaignsRes.error) {
        console.error('Campaigns fetch error:', campaignsRes.error);
        // If no campaigns found, proceed with page connection only
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

  const handleCampaignToggle = async (campaign: Campaign) => {
    const isSelected = selectedCampaigns.some(c => c.id === campaign.id);
    
    let newSelectedCampaigns: SelectedItem[];
    if (isSelected) {
      newSelectedCampaigns = selectedCampaigns.filter(c => c.id !== campaign.id);
      // Also remove adsets from this campaign
      setSelectedAdsets(prev => prev.filter(a => {
        const adset = adsets.find(ad => ad.id === a.id);
        return adset?.campaignId !== campaign.id;
      }));
    } else {
      newSelectedCampaigns = [...selectedCampaigns, { id: campaign.id, name: campaign.name }];
    }
    
    setSelectedCampaigns(newSelectedCampaigns);

    // Fetch adsets for newly selected campaigns
    if (!isSelected && longLivedToken) {
      setLoadingAdsets(true);
      try {
        const adsetsRes = await supabase.functions.invoke('facebook-oauth', {
          body: { action: 'adsets', longLivedToken, campaignIds: [campaign.id] },
        });

        if (!adsetsRes.error && adsetsRes.data?.adsets) {
          setAdsets(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newAdsets = adsetsRes.data.adsets.filter((a: Adset) => !existingIds.has(a.id));
            return [...prev, ...newAdsets];
          });
        }
      } catch (error) {
        console.error('Error fetching adsets:', error);
      } finally {
        setLoadingAdsets(false);
      }
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

  const handleCompleteConnection = async () => {
    if (!longLivedToken || !selectedPage) return;
    
    setLoading(true);
    setShowCampaignDialog(false);

    try {
      const connectRes = await supabase.functions.invoke('facebook-oauth', {
        body: { 
          action: 'connect', 
          longLivedToken, 
          pageId: selectedPage.id, 
          pageName: selectedPage.name,
          fbUserId,
          selectedCampaigns,
          selectedAdsets,
        },
      });

      if (connectRes.error) {
        throw new Error(connectRes.error.message || 'Connection failed');
      }

      const filterInfo = selectedCampaigns.length > 0 
        ? ` ${selectedCampaigns.length} kampanya ve ${selectedAdsets.length} ad set seçildi.`
        : ' Tüm lead\'ler senkronize edilecek.';

      toast({
        title: 'Bağlantı Başarılı! 🎉',
        description: `${selectedPage.name} sayfası CRM'e bağlandı.${filterInfo}`,
      });

      await loadConnectionStatus();
      resetState();
    } catch (error: any) {
      console.error('Page connect error:', error);
      toast({
        title: 'Bağlantı Hatası',
        description: error.message || 'Sayfa bağlanamadı',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFilterDialog = async () => {
    setShowFilterDialog(true);
    setLoadingCampaigns(true);
    
    // Load current filters
    setSelectedCampaigns(connectionStatus.selectedCampaigns);
    setSelectedAdsets(connectionStatus.selectedAdsets);

    try {
      // Get fresh token from backend
      const filtersRes = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'get-filters' },
      });

      if (filtersRes.error || !filtersRes.data?.hasToken) {
        toast({
          title: 'Hata',
          description: 'Kampanya bilgisi alınamadı. Lütfen tekrar bağlanın.',
          variant: 'destructive',
        });
        setShowFilterDialog(false);
        return;
      }

      // We need to re-login to get a fresh token for API calls
      // For now, show current filters but inform user
      setCampaigns([]);
      setAdsets([]);
      
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleUpdateFilters = async () => {
    setLoading(true);

    try {
      const updateRes = await supabase.functions.invoke('facebook-oauth', {
        body: { 
          action: 'update-filters', 
          selectedCampaigns,
          selectedAdsets,
        },
      });

      if (updateRes.error) {
        throw new Error(updateRes.error.message || 'Update failed');
      }

      toast({
        title: 'Filtreler Güncellendi',
        description: `${selectedCampaigns.length} kampanya ve ${selectedAdsets.length} ad set seçili.`,
      });

      await loadConnectionStatus();
      setShowFilterDialog(false);
    } catch (error: any) {
      console.error('Filter update error:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Filtreler güncellenemedi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Facebook bağlantısını kaldırmak istediğinize emin misiniz?')) {
      return;
    }

    setLoading(true);

    try {
      const disconnectRes = await supabase.functions.invoke('facebook-oauth', {
        body: { action: 'disconnect' },
      });

      if (disconnectRes.error) {
        throw new Error(disconnectRes.error.message || 'Disconnect failed');
      }

      toast({
        title: 'Bağlantı Kaldırıldı',
        description: 'Facebook sayfası bağlantısı kaldırıldı.',
      });

      setConnectionStatus({
        connected: false,
        pageName: null,
        pageId: null,
        connectedAt: null,
        selectedCampaigns: [],
        selectedAdsets: [],
      });
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Hata',
        description: error.message || 'Bağlantı kaldırılamadı',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLongLivedToken(null);
    setFbUserId(null);
    setPages([]);
    setSelectedPage(null);
    setCampaigns([]);
    setAdsets([]);
    setSelectedCampaigns([]);
    setSelectedAdsets([]);
    setPermissionInfo(null);
    setErrorCode(null);
  };

  const getSelectedCampaignAdsets = () => {
    const selectedCampaignIds = new Set(selectedCampaigns.map(c => c.id));
    return adsets.filter(a => selectedCampaignIds.has(a.campaignId));
  };

  const getPermissionErrorMessage = () => {
    if (!permissionInfo) {
      return {
        title: 'Sayfa Bulunamadı',
        description: 'Facebook hesabınıza bağlı yönetici olduğunuz bir sayfa bulunamadı.'
      };
    }

    if (permissionInfo.declined.length > 0) {
      return {
        title: 'İzinler Reddedildi',
        description: `Şu izinler reddedildi: ${permissionInfo.declined.join(', ')}. Bu izinler lead\'lerin çekilmesi için gereklidir.`
      };
    }

    if (permissionInfo.missing.length > 0) {
      return {
        title: 'Eksik İzinler',
        description: `Şu izinler eksik: ${permissionInfo.missing.join(', ')}. Facebook uygulama ayarlarından bu izinleri vermeniz gerekiyor.`
      };
    }

    return {
      title: 'Sayfa Bulunamadı',
      description: 'Meta Business Suite\'te sayfa yöneticisi olduğunuzdan emin olun.'
    };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-primary" />
            Facebook Lead Ads
          </CardTitle>
          <CardDescription>
            Facebook sayfanızı bağlayarak lead'lerin otomatik olarak CRM'e aktarılmasını sağlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                <Check className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-success">
                    Bağlı: {connectionStatus.pageName}
                  </p>
                  {connectionStatus.connectedAt && (
                    <p className="text-sm text-success/80">
                      Bağlantı: {format(new Date(connectionStatus.connectedAt), 'd MMMM yyyy', { locale: tr })}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Filter Summary */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 border rounded-lg">
                <Filter className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  {connectionStatus.selectedCampaigns.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {connectionStatus.selectedCampaigns.length} Kampanya Seçili
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {connectionStatus.selectedCampaigns.slice(0, 3).map(c => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.name}
                          </Badge>
                        ))}
                        {connectionStatus.selectedCampaigns.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{connectionStatus.selectedCampaigns.length - 3} daha
                          </Badge>
                        )}
                      </div>
                      {connectionStatus.selectedAdsets.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {connectionStatus.selectedAdsets.length} Ad Set seçili
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Tüm kampanyalardan lead'ler alınıyor
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleOpenFilterDialog}
                  disabled={loading}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Bağlantıyı Kaldır
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Facebook ile bağlanarak, lead form'larından gelen kişilerin otomatik olarak CRM'e eklenmesini sağlayabilirsiniz.
                </p>
              </div>
              <Button 
                onClick={handleFacebookLogin}
                disabled={loading || !sdkLoaded}
                className="w-full"
                style={{ backgroundColor: '#1877F2' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Facebook className="w-4 h-4 mr-2" />
                )}
                {!sdkLoaded ? 'Yükleniyor...' : 'Facebook ile Bağlan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page Selection Dialog */}
      <Dialog open={showPageDialog} onOpenChange={(open) => {
        setShowPageDialog(open);
        if (!open) resetState();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sayfa Seçin</DialogTitle>
            <DialogDescription>
              Lead'lerin geleceği Facebook sayfasını seçin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {pages.map((page) => (
              <Button
                key={page.id}
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => handlePageSelect(page)}
                disabled={loading}
              >
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
        </DialogContent>
      </Dialog>

      {/* Campaign & Adset Selection Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={(open) => {
        setShowCampaignDialog(open);
        if (!open) resetState();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Kampanya ve Ad Set Seçimi</DialogTitle>
            <DialogDescription>
              {selectedPage?.name} sayfası için hangi kampanyalardan lead almak istediğinizi seçin.
              Hiçbir şey seçmezseniz tüm lead'ler senkronize edilir.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Kampanyalar yükleniyor...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Lead Generation kampanyası bulunamadı.
                  <br />
                  <span className="text-sm">Tüm lead'ler otomatik olarak senkronize edilecek.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Campaigns */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Kampanyalar ({campaigns.length})
                  </h4>
                  <div className="space-y-2">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleCampaignToggle(campaign)}
                      >
                        <Checkbox
                          checked={selectedCampaigns.some(c => c.id === campaign.id)}
                          onCheckedChange={() => handleCampaignToggle(campaign)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {campaign.id}</p>
                        </div>
                        <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adsets for selected campaigns */}
                {selectedCampaigns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Ad Setler
                      {loadingAdsets && <Loader2 className="w-4 h-4 animate-spin" />}
                    </h4>
                    {getSelectedCampaignAdsets().length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        {loadingAdsets ? 'Yükleniyor...' : 'Seçili kampanyalarda ad set bulunamadı veya tüm ad setler alınacak.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {getSelectedCampaignAdsets().map((adset) => (
                          <div
                            key={adset.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ml-4"
                            onClick={() => handleAdsetToggle(adset)}
                          >
                            <Checkbox
                              checked={selectedAdsets.some(a => a.id === adset.id)}
                              onCheckedChange={() => handleAdsetToggle(adset)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{adset.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Kampanya: {campaigns.find(c => c.id === adset.campaignId)?.name}
                              </p>
                            </div>
                            <Badge variant={adset.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {adset.status}
                            </Badge>
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
              {selectedCampaigns.length > 0 
                ? `${selectedCampaigns.length} kampanya, ${selectedAdsets.length} ad set seçili`
                : 'Tüm lead\'ler senkronize edilecek'}
            </div>
            <Button variant="outline" onClick={() => {
              setShowCampaignDialog(false);
              resetState();
            }}>
              İptal
            </Button>
            <Button onClick={handleCompleteConnection} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Bağlantıyı Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Management Dialog (for existing connection) */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kampanya Filtreleri</DialogTitle>
            <DialogDescription>
              Mevcut kampanya ve ad set seçimlerinizi güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Seçili Kampanyalar</p>
              {selectedCampaigns.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedCampaigns.map(c => (
                    <Badge 
                      key={c.id} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => setSelectedCampaigns(prev => prev.filter(p => p.id !== c.id))}
                    >
                      {c.name} ×
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tüm kampanyalar</p>
              )}
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Seçili Ad Setler</p>
              {selectedAdsets.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedAdsets.map(a => (
                    <Badge 
                      key={a.id} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setSelectedAdsets(prev => prev.filter(p => p.id !== a.id))}
                    >
                      {a.name} ×
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tüm ad setler</p>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Yeni kampanya eklemek için Facebook'a tekrar bağlanmanız gerekebilir.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleUpdateFilters} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Error Dialog */}
      <Dialog open={showPermissionError} onOpenChange={(open) => {
        setShowPermissionError(open);
        if (!open) {
          resetState();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {getPermissionErrorMessage().title}
            </DialogTitle>
            <DialogDescription>
              {getPermissionErrorMessage().description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ne Yapmalısınız?</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>1. <strong>Meta Business Suite</strong>'e gidin</p>
                <p>2. İlgili sayfada <strong>admin/yönetici</strong> rolünüz olduğunu kontrol edin</p>
                <p>3. Facebook &gt; Ayarlar &gt; Uygulamalar bölümünden bu uygulamanın izinlerini kontrol edin</p>
              </AlertDescription>
            </Alert>

            {permissionInfo && (
              <div className="space-y-2">
                {permissionInfo.granted.length > 0 && (
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-sm font-medium text-success mb-1">✓ Verilen İzinler</p>
                    <div className="flex flex-wrap gap-1">
                      {permissionInfo.granted.map(p => (
                        <Badge key={p} variant="outline" className="text-xs text-success border-success">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {permissionInfo.missing.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">✗ Eksik İzinler</p>
                    <div className="flex flex-wrap gap-1">
                      {permissionInfo.missing.map(p => (
                        <Badge key={p} variant="outline" className="text-xs text-destructive border-destructive">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {permissionInfo.declined.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">✗ Reddedilen İzinler</p>
                    <div className="flex flex-wrap gap-1">
                      {permissionInfo.declined.map(p => (
                        <Badge key={p} variant="outline" className="text-xs text-destructive border-destructive">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open('https://business.facebook.com/settings/pages', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Meta Business Suite
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://www.facebook.com/settings?tab=applications&app_id=${FB_APP_ID}`, '_blank')}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Uygulama İzinleri
            </Button>
            <Button 
              onClick={() => {
                setShowPermissionError(false);
                resetState();
                // Trigger new login
                handleFacebookLogin();
              }}
            >
              Tekrar Dene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}