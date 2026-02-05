import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Facebook, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Facebook App ID (public, safe to expose)
const FB_APP_ID = '690197103638958';

interface FacebookPage {
  id: string;
  name: string;
}

interface ConnectionStatus {
  connected: boolean;
  pageName: string | null;
  pageId: string | null;
  connectedAt: string | null;
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
  });
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [longLivedToken, setLongLivedToken] = useState<string | null>(null);
  const [fbUserId, setFbUserId] = useState<string | null>(null);

  // Load connection status
  const loadConnectionStatus = useCallback(async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('fb_page_id, fb_page_name, fb_connected_at')
        .eq('id', profile.organization_id)
        .single();

      if (error) throw error;

      setConnectionStatus({
        connected: !!data?.fb_page_id,
        pageName: data?.fb_page_name || null,
        pageId: data?.fb_page_id || null,
        connectedAt: data?.fb_connected_at || null,
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
      // fbAsyncInit should handle initialization
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

    // FB.login bazen popup engellendiğinde / Safari ITP'de callback dönmeden takılabiliyor.
    // Sonsuz spinner yerine kullanıcıya net bir uyarı verelim.
    const loginTimeout = window.setTimeout(() => {
      console.warn('FB.login timed out - possible popup block');
      setLoading(false);
      toast({
        title: 'Facebook penceresi açılamadı',
        description:
          'Popup engellenmiş olabilir. Tarayıcı adres çubuğundaki popup engelleme ikonundan izin verip tekrar deneyin (adblock da engelleyebilir).',
        variant: 'destructive',
      });
    }, 20000);

    try {
      window.FB.login(
        async (response: any) => {
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

              const { longLivedToken: token } = exchangeRes.data;
              setLongLivedToken(token);

              // Get pages
              const pagesRes = await supabase.functions.invoke('facebook-oauth', {
                body: { action: 'pages', longLivedToken: token },
              });

              if (pagesRes.error) {
                throw new Error(pagesRes.error.message || 'Failed to fetch pages');
              }

              const { pages: userPages } = pagesRes.data;

              if (!userPages || userPages.length === 0) {
                toast({
                  title: 'Sayfa Bulunamadı',
                  description: 'Facebook hesabınıza bağlı yönetici olduğunuz bir sayfa bulunamadı.',
                  variant: 'destructive',
                });
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
        },
        {
          scope: 'pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata',
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
    if (!longLivedToken) return;
    
    setLoading(true);
    setShowPageDialog(false);

    try {
      const connectRes = await supabase.functions.invoke('facebook-oauth', {
        body: { 
          action: 'connect', 
          longLivedToken, 
          pageId: page.id, 
          pageName: page.name,
          fbUserId,
        },
      });

      if (connectRes.error) {
        throw new Error(connectRes.error.message || 'Connection failed');
      }

      toast({
        title: 'Bağlantı Başarılı! 🎉',
        description: `${page.name} sayfası CRM'e bağlandı. Artık leadler otomatik gelecek!`,
      });

      await loadConnectionStatus();
    } catch (error: any) {
      console.error('Page connect error:', error);
      toast({
        title: 'Bağlantı Hatası',
        description: error.message || 'Sayfa bağlanamadı',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLongLivedToken(null);
      setFbUserId(null);
      setPages([]);
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
      <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
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
                className="w-full justify-start h-auto py-3"
                onClick={() => handlePageSelect(page)}
                disabled={loading}
              >
                <Facebook className="w-4 h-4 mr-3 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{page.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
