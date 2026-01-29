import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Users,
  RefreshCw,
  MailOpen,
  MailX,
  Copy,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  created_at: string;
}

interface CampaignRecipient {
  id: string;
  campaign_id: string;
  email: string;
  recipient_name: string | null;
  recipient_type: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  error_message: string | null;
}

interface CampaignDetailDialogProps {
  campaign: EmailCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (campaign: EmailCampaign) => void;
}

export function CampaignDetailDialog({ campaign, open, onOpenChange, onEdit }: CampaignDetailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch campaign recipients
  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ['campaign-recipients-detail', campaign?.id],
    queryFn: async () => {
      if (!campaign) return [];
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('sent_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as CampaignRecipient[];
    },
    enabled: !!campaign && open
  });

  // Resend campaign mutation
  const resendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // First, reset the campaign status and recipient statuses
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'draft',
          sent_count: 0,
          failed_count: 0,
          started_at: null,
          completed_at: null
        })
        .eq('id', campaignId);

      // Reset all recipients to pending
      await supabase
        .from('campaign_recipients')
        .update({ 
          status: 'pending',
          sent_at: null,
          error_message: null
        })
        .eq('campaign_id', campaignId);

      // Now send the campaign
      const { data, error } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaign_id: campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients-detail'] });
      toast({ 
        title: "Campaign resending started", 
        description: `Resending to ${data.total} recipients...` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error resending campaign", description: error.message, variant: "destructive" });
    }
  });

  // Resend to failed only mutation
  const resendToFailedMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // Reset only failed recipients to pending
      await supabase
        .from('campaign_recipients')
        .update({ 
          status: 'pending',
          sent_at: null,
          error_message: null
        })
        .eq('campaign_id', campaignId)
        .eq('status', 'failed');

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'draft',
          started_at: null,
          completed_at: null
        })
        .eq('id', campaignId);

      // Now send the campaign
      const { data, error } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaign_id: campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients-detail'] });
      toast({ 
        title: "Resending to failed recipients", 
        description: `Resending to ${data.total} recipients...` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error resending campaign", description: error.message, variant: "destructive" });
    }
  });

  // Duplicate campaign mutation
  const duplicateCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!campaign) throw new Error("No campaign selected");

      // Create new campaign as a copy
      const { data: newCampaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          name: `${campaign.name} (Copy)`,
          subject: campaign.subject,
          content: campaign.content,
          organization_id: (await supabase.from('email_campaigns').select('organization_id').eq('id', campaignId).single()).data?.organization_id,
          status: 'draft',
          total_recipients: campaign.total_recipients
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Copy recipients
      const recipientsToCopy = recipients.map(r => ({
        campaign_id: newCampaign.id,
        email: r.email,
        recipient_name: r.recipient_name,
        recipient_type: r.recipient_type,
        recipient_id: null,
        status: 'pending'
      }));

      if (recipientsToCopy.length > 0) {
        const { error: recipientsError } = await supabase
          .from('campaign_recipients')
          .insert(recipientsToCopy);
        if (recipientsError) throw recipientsError;
      }

      return newCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: "Campaign duplicated", description: "You can now edit the copy" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error duplicating campaign", description: error.message, variant: "destructive" });
    }
  });

  if (!campaign) return null;

  const sentRecipients = recipients.filter(r => r.status === 'sent');
  const failedRecipients = recipients.filter(r => r.status === 'failed');
  const pendingRecipients = recipients.filter(r => r.status === 'pending');
  const openedRecipients = recipients.filter(r => r.opened_at);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const successRate = campaign.total_recipients > 0 
    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
              <DialogDescription>{campaign.subject}</DialogDescription>
            </div>
            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="recipients" className="gap-2">
              <Users className="h-4 w-4" />
              Recipients ({recipients.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Mail className="h-4 w-4" />
              Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{campaign.total_recipients}</p>
                  <p className="text-xs text-muted-foreground">Total Recipients</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{campaign.sent_count}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{campaign.failed_count}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MailOpen className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{openedRecipients.length}</p>
                  <p className="text-xs text-muted-foreground">Opened</p>
                </CardContent>
              </Card>
            </div>

            {/* Success Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-semibold">{successRate}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(campaign.created_at), 'MMM d, yyyy HH:mm')}</span>
                </div>
                {campaign.started_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span>{format(new Date(campaign.started_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                )}
                {campaign.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{format(new Date(campaign.completed_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipients" className="flex-1 overflow-hidden mt-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Recipient Details</CardTitle>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {sentRecipients.length} Sent
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {failedRecipients.length} Failed
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      {pendingRecipients.length} Pending
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {recipientsLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipients.map((recipient) => (
                          <TableRow key={recipient.id}>
                            <TableCell>{getStatusIcon(recipient.status)}</TableCell>
                            <TableCell className="font-medium">{recipient.recipient_name || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{recipient.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">
                                {recipient.recipient_type || 'unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {recipient.sent_at 
                                ? format(new Date(recipient.sent_at), 'MMM d, HH:mm') 
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-xs text-red-500 max-w-[150px] truncate" title={recipient.error_message || ''}>
                              {recipient.error_message || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="flex-1 overflow-hidden mt-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Email Content</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: campaign.content }}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          {/* Actions based on campaign status */}
          {campaign.status === 'sent' && (
            <>
              {failedRecipients.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => resendToFailedMutation.mutate(campaign.id)}
                  disabled={resendToFailedMutation.isPending}
                  className="gap-2"
                >
                  <MailX className="h-4 w-4" />
                  Resend to Failed ({failedRecipients.length})
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => resendCampaignMutation.mutate(campaign.id)}
                disabled={resendCampaignMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Resend All
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => duplicateCampaignMutation.mutate(campaign.id)}
            disabled={duplicateCampaignMutation.isPending}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>

          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              onEdit(campaign);
            }}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Edit
          </Button>

          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
