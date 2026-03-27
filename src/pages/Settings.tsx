import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Key, MessageSquare, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ActivityLogs } from '@/components/ActivityLogs';
import { BatchWebPConverter } from '@/components/BatchWebPConverter';
import { ThemeSelector } from '@/components/ThemeSelector';
import { FacebookConnectButton } from '@/components/FacebookConnectButton';
import { AdPerformanceDashboard } from '@/components/AdPerformanceDashboard';
import { AgreementCheckbox } from '@/components/AgreementCheckbox';


export default function Settings() {
  const { profile, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [waAgreed, setWaAgreed] = useState(false);
  const [orgData, setOrgData] = useState({
    wa_phone_number_id: '',
    wa_access_token: '',
  });

  useEffect(() => {
    loadOrganizationSettings();
  }, [profile]);

  const loadOrganizationSettings = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('wa_phone_number_id, wa_access_token')
        .eq('id', profile.organization_id)
        .single();

      if (error) throw error;
      
      if (data) {
        setOrgData({
          wa_phone_number_id: data.wa_phone_number_id || '',
          wa_access_token: data.wa_access_token || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          wa_phone_number_id: orgData.wa_phone_number_id || null,
          wa_access_token: orgData.wa_access_token || null,
        })
        .eq('id', profile.organization_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Configure API integrations and organization settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Facebook Lead Ads - OAuth Integration */}
          <FacebookConnectButton />

          {/* WhatsApp Business Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-success" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Enable WhatsApp messaging for patient communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wa_phone_number_id">
                  Phone Number ID
                </Label>
                <Input
                  id="wa_phone_number_id"
                  placeholder="Enter your Phone Number ID"
                  value={orgData.wa_phone_number_id}
                  onChange={(e) => setOrgData({ ...orgData, wa_phone_number_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Found in WhatsApp Business Platform settings
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa_access_token">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Access Token
                  </div>
                </Label>
                <Input
                  id="wa_access_token"
                  type="password"
                  placeholder="Enter your WhatsApp Access Token"
                  value={orgData.wa_access_token}
                  onChange={(e) => setOrgData({ ...orgData, wa_access_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Permanent access token for WhatsApp Business API
                </p>
              </div>
              <AgreementCheckbox agreed={waAgreed} onAgreedChange={setWaAgreed} />
            </CardContent>
          </Card>
        </div>



        {/* General Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              General Information
            </CardTitle>
            <CardDescription>
              Your organization and user information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">User Name</p>
                <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              {profile?.phone && (
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ad Performance Dashboard */}
        <AdPerformanceDashboard autoFetch={true} />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading || !waAgreed} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Theme Selector - Super Admins Only */}
        {isSuperAdmin && <BatchWebPConverter />}

        {/* Theme Selector - Super Admins Only */}
        {isSuperAdmin && <ThemeSelector />}

        {/* Activity Logs - Super Admins Only */}
        {isSuperAdmin && <ActivityLogs />}
      </div>
    </>
  );
}
