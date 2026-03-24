import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { CampaignDetailDialog } from "@/components/CampaignDetailDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Plus, 
  FileText, 
  Users, 
  Send, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  Eye,
  Copy,
  Building2,
  UserCheck,
  UserX,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  html_content: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  lead_count?: number;
  patient_count?: number;
  user_count?: number;
}

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
  template?: EmailTemplate;
}

interface Recipient {
  id: string;
  email: string;
  name: string;
  type: 'lead' | 'patient' | 'user';
  organization_name?: string;
  status?: string;
  role?: string;
}

export default function Mailing() {
  const { isSuperAdmin, profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;

  // Upload email logo to Supabase Storage (ensures correct logo is always available)
  useEffect(() => {
    const uploadEmailLogo = async () => {
      try {
        const response = await fetch("/miss-endo-logo.png");
        if (!response.ok) return;
        const contentType = response.headers.get("content-type");
        if (!contentType?.startsWith("image/")) return;
        const blob = await response.blob();
        
        // Check if the stored file matches our local file size
        const { data: existingFiles } = await supabase.storage
          .from("email-assets")
          .list("", { search: "miss-endo-logo.png" });
        const existingFile = existingFiles?.find(f => f.name === "miss-endo-logo.png");
        if (existingFile && (existingFile as any).metadata?.size === blob.size) {
          return; // Already correct
        }

        await supabase.storage.from("email-assets").remove(["miss-endo-logo.png"]);
        const { error } = await supabase.storage.from("email-assets").upload("miss-endo-logo.png", blob, {
          contentType: "image/png",
          upsert: true,
        });
        if (error) console.error("Failed to upload email logo:", error);
        else console.log("Email logo uploaded to Supabase Storage successfully");
      } catch (err) {
        console.error("Error uploading email logo:", err);
      }
    };
    uploadEmailLogo();
  }, []);

  // State
  const [activeTab, setActiveTab] = useState("campaigns");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Template Dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    content: "",
    html_content: ""
  });

  // Group Dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    color: "#6366f1"
  });
  const [groupMembersDialogOpen, setGroupMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);

  // Campaign Dialog
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignStep, setCampaignStep] = useState(1);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    content: "",
    template_id: ""
  });
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [recipientSource, setRecipientSource] = useState<'individual' | 'group' | 'organization' | 'lead_status'>('individual');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<string>("");
  
  // Edit Campaign Dialog
  const [editCampaignDialogOpen, setEditCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [editCampaignForm, setEditCampaignForm] = useState({
    name: "",
    subject: "",
    content: ""
  });
  const [editCampaignStep, setEditCampaignStep] = useState<'content' | 'recipients'>('content');

  // Campaign Detail Dialog
  const [detailCampaign, setDetailCampaign] = useState<EmailCampaign | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Delete Campaign Dialog
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  const [deleteCampaignDialogOpen, setDeleteCampaignDialogOpen] = useState(false);

  // Queries
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!isSuperAdmin && organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailTemplate[];
    }
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['contact-groups', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('contact_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!isSuperAdmin && organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      // Get member counts
      const groupsWithCounts = await Promise.all((data || []).map(async (group) => {
        const [leadCount, patientCount, userCount] = await Promise.all([
          supabase.from('lead_group_members').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
          supabase.from('patient_group_members').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
          supabase.from('user_group_members').select('id', { count: 'exact', head: true }).eq('group_id', group.id)
        ]);
        return {
          ...group,
          lead_count: leadCount.count || 0,
          patient_count: patientCount.count || 0,
          user_count: userCount.count || 0
        };
      }));

      return groupsWithCounts as ContactGroup[];
    }
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['email-campaigns', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('email_campaigns')
        .select('*, template:email_templates(*)')
        .order('created_at', { ascending: false });
      
      if (!isSuperAdmin && organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailCampaign[];
    }
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-mailing', organizationId, selectedOrganizationId, selectedLeadStatus],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone, status, organization:organizations(name)')
        .not('email', 'is', null)
        .neq('email', '');

      if (!isSuperAdmin && organizationId) {
        query = query.eq('organization_id', organizationId);
      } else if (selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId);
      }

      if (selectedLeadStatus) {
        query = query.eq('status', selectedLeadStatus as any);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-for-mailing', organizationId, selectedOrganizationId],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone, organization:organizations(name)')
        .not('email', 'is', null)
        .neq('email', '');

      if (!isSuperAdmin && organizationId) {
        query = query.eq('organization_id', organizationId);
      } else if (selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Query for system users (only for super admins)
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['users-for-mailing', selectedOrganizationId],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, is_active, organization_id, organization:organizations(name)')
        .eq('is_active', true)
        .not('email', 'is', null)
        .neq('email', '')
        .order('created_at', { ascending: false });
      
      if (selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin
  });

  // Query for today's email usage (daily limit tracking)
  const { data: todayEmailCount = 0 } = useQuery({
    queryKey: ['today-email-count'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', today.toISOString())
        .eq('status', 'sent');
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Query for campaign recipients when editing
  const { data: campaignRecipients = [] } = useQuery({
    queryKey: ['campaign-recipients', editingCampaign?.id],
    queryFn: async () => {
      if (!editingCampaign) return [];
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', editingCampaign.id);
      if (error) throw error;
      return data;
    },
    enabled: !!editingCampaign
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      const { error } = await supabase.from('email_templates').insert({
        ...data,
        organization_id: organizationId,
        created_by: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setTemplateDialogOpen(false);
      resetTemplateForm();
      toast({ title: "Template created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating template", description: error.message, variant: "destructive" });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof templateForm }) => {
      const { error } = await supabase.from('email_templates').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
      toast({ title: "Template updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating template", description: error.message, variant: "destructive" });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting template", description: error.message, variant: "destructive" });
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof groupForm) => {
      const { error } = await supabase.from('contact_groups').insert({
        ...data,
        organization_id: organizationId,
        created_by: user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      setGroupDialogOpen(false);
      resetGroupForm();
      toast({ title: "Group created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating group", description: error.message, variant: "destructive" });
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof groupForm }) => {
      const { error } = await supabase.from('contact_groups').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      setGroupDialogOpen(false);
      setEditingGroup(null);
      resetGroupForm();
      toast({ title: "Group updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating group", description: error.message, variant: "destructive" });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      toast({ title: "Group deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaignForm.name,
          subject: campaignForm.subject,
          content: campaignForm.content,
          template_id: campaignForm.template_id || null,
          organization_id: organizationId,
          created_by: user?.id,
          total_recipients: selectedRecipients.length,
          status: 'draft'
        })
        .select()
        .single();
      
      if (campaignError) throw campaignError;

      // Add recipients
      const recipients = selectedRecipients.map(r => ({
        campaign_id: campaign.id,
        email: r.email,
        recipient_name: r.name,
        recipient_type: r.type,
        recipient_id: r.id
      }));

      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .insert(recipients);
      
      if (recipientsError) throw recipientsError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setCampaignDialogOpen(false);
      resetCampaignForm();
      toast({ title: "Campaign created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaign_id: campaignId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ 
        title: "Campaign sending started", 
        description: `Sending to ${data.total} recipients...` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error sending campaign", description: error.message, variant: "destructive" });
    }
  });

  // Update campaign content mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, data }: { campaignId: string; data: { name: string; subject: string; content: string } }) => {
      const { error } = await supabase
        .from('email_campaigns')
        .update(data)
        .eq('id', campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: "Campaign content updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating campaign", description: error.message, variant: "destructive" });
    }
  });

  // Update campaign recipients mutation
  const updateCampaignRecipientsMutation = useMutation({
    mutationFn: async ({ campaignId, recipients }: { campaignId: string; recipients: Recipient[] }) => {
      // Delete existing recipients
      const { error: deleteError } = await supabase
        .from('campaign_recipients')
        .delete()
        .eq('campaign_id', campaignId);
      
      if (deleteError) throw deleteError;

      // Insert new recipients
      if (recipients.length > 0) {
        const recipientData = recipients.map(r => ({
          campaign_id: campaignId,
          email: r.email,
          recipient_name: r.name,
          recipient_type: r.type,
          recipient_id: r.id
        }));

        const { error: insertError } = await supabase
          .from('campaign_recipients')
          .insert(recipientData);
        
        if (insertError) throw insertError;
      }

      // Update campaign total_recipients count
      const { error: updateError } = await supabase
        .from('email_campaigns')
        .update({ total_recipients: recipients.length })
        .eq('id', campaignId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients'] });
      setEditCampaignDialogOpen(false);
      setEditingCampaign(null);
      setSelectedRecipients([]);
      setEditCampaignStep('content');
      toast({ title: "Campaign updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating recipients", description: error.message, variant: "destructive" });
    }
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // First delete campaign recipients
      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .delete()
        .eq('campaign_id', campaignId);
      if (recipientsError) throw recipientsError;

      // Then delete the campaign
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      setDeleteCampaignDialogOpen(false);
      setDeleteCampaignId(null);
      toast({ title: "Kampanya başarıyla silindi" });
    },
    onError: (error: any) => {
      toast({ title: "Kampanya silinirken hata oluştu", description: error.message, variant: "destructive" });
    }
  });

  // Form helpers
  const resetTemplateForm = () => {
    setTemplateForm({ name: "", subject: "", content: "", html_content: "" });
  };

  const resetGroupForm = () => {
    setGroupForm({ name: "", description: "", color: "#6366f1" });
  };

  const resetCampaignForm = () => {
    setCampaignForm({ name: "", subject: "", content: "", template_id: "" });
    setSelectedRecipients([]);
    setCampaignStep(1);
    setRecipientSource('individual');
    setSelectedOrganizationId("");
    setSelectedGroupId("");
    setSelectedLeadStatus("");
  };

  const openEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      html_content: template.html_content || ""
    });
    setTemplateDialogOpen(true);
  };

  const openEditGroup = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      color: group.color
    });
    setGroupDialogOpen(true);
  };

  const handleTemplateSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleGroupSubmit = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupForm });
    } else {
      createGroupMutation.mutate(groupForm);
    }
  };

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev => {
      const exists = prev.find(r => r.id === recipient.id && r.type === recipient.type);
      if (exists) {
        return prev.filter(r => !(r.id === recipient.id && r.type === recipient.type));
      }
      return [...prev, recipient];
    });
  };

  const selectAllLeads = () => {
    const leadsAsRecipients: Recipient[] = leads.map((l: any) => ({
      id: l.id,
      email: l.email,
      name: `${l.first_name} ${l.last_name}`,
      type: 'lead' as const,
      organization_name: l.organization?.name,
      status: l.status
    }));
    setSelectedRecipients(prev => {
      const newRecipients = leadsAsRecipients.filter(lr => 
        !prev.find(p => p.id === lr.id && p.type === 'lead')
      );
      return [...prev, ...newRecipients];
    });
  };

  const selectAllPatients = () => {
    const patientsAsRecipients: Recipient[] = patients.map((p: any) => ({
      id: p.id,
      email: p.email,
      name: `${p.first_name} ${p.last_name}`,
      type: 'patient' as const,
      organization_name: p.organization?.name
    }));
    setSelectedRecipients(prev => {
      const newRecipients = patientsAsRecipients.filter(pr => 
        !prev.find(p => p.id === pr.id && p.type === 'patient')
      );
      return [...prev, ...newRecipients];
    });
  };

  const selectAllUsers = () => {
    const usersAsRecipients: Recipient[] = systemUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      type: 'user' as const,
      organization_name: u.organization?.name
    }));
    setSelectedRecipients(prev => {
      const newRecipients = usersAsRecipients.filter(ur => 
        !prev.find(p => p.id === ur.id && p.type === 'user')
      );
      return [...prev, ...newRecipients];
    });
  };

  const openEditCampaign = async (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setEditCampaignForm({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content
    });
    setEditCampaignStep('content');
    setEditCampaignDialogOpen(true);
  };

  // Load recipients when editing campaign opens
  useEffect(() => {
    if (editingCampaign && campaignRecipients.length > 0) {
      const recipients: Recipient[] = campaignRecipients.map((r: any) => ({
        id: r.recipient_id || r.id,
        email: r.email,
        name: r.recipient_name || 'Unknown',
        type: r.recipient_type as 'lead' | 'patient' | 'user'
      }));
      setSelectedRecipients(recipients);
    }
  }, [editingCampaign, campaignRecipients]);

  const useTemplate = (template: EmailTemplate) => {
    setCampaignForm(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      template_id: template.id
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-purple-100 text-purple-800';
      case 'no_contact': return 'bg-orange-100 text-orange-800';
      case 'appointment_scheduled': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'will_not_come': return 'bg-gray-100 text-gray-800';
      case 'converted_to_patient': return 'bg-teal-100 text-teal-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const leadStatuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'no_contact', label: 'No Contact' },
    { value: 'appointment_scheduled', label: 'Appointment Scheduled' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'will_not_come', label: 'Will Not Come' },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              Email Marketing
            </h1>
            <p className="text-muted-foreground mt-1">
              Create campaigns, manage templates, and send emails to your contacts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`gap-1.5 ${todayEmailCount >= 900 ? 'border-destructive text-destructive' : todayEmailCount >= 700 ? 'border-warning text-warning' : ''}`}
            >
              <Mail className="h-3 w-3" />
              <span className="font-medium">{todayEmailCount}</span>
              <span className="text-muted-foreground">/</span>
              <span>1000</span>
              <span className="text-xs text-muted-foreground ml-1">today</span>
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              Groups
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setCampaignDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </div>

            {campaignsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No campaigns yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    Create your first email campaign to start reaching your contacts.
                  </p>
                  <Button onClick={() => setCampaignDialogOpen(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {campaigns
                  .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((campaign) => (
                    <Card key={campaign.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{campaign.name}</h3>
                              <Badge className={getStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              Created: {format(new Date(campaign.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-semibold">{campaign.total_recipients}</p>
                                <p className="text-xs text-muted-foreground">Recipients</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-green-600">{campaign.sent_count}</p>
                                <p className="text-xs text-muted-foreground">Sent</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-red-600">{campaign.failed_count}</p>
                                <p className="text-xs text-muted-foreground">Failed</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {campaign.status === 'draft' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openEditCampaign(campaign)}
                                    className="gap-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => sendCampaignMutation.mutate(campaign.id)}
                                    disabled={sendCampaignMutation.isPending}
                                    className="gap-1"
                                  >
                                    <Send className="h-3 w-3" />
                                    Send
                                  </Button>
                                </>
                              )}
                              {campaign.status === 'sent' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openEditCampaign(campaign)}
                                    className="gap-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setDetailCampaign(campaign);
                                      setDetailDialogOpen(true);
                                    }}
                                    className="gap-1"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    Resend
                                  </Button>
                                </>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setDetailCampaign(campaign);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeleteCampaignId(campaign.id);
                                  setDeleteCampaignDialogOpen(true);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setTemplateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </div>

            {templatesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No templates yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    Create reusable email templates to speed up your campaign creation.
                  </p>
                  <Button onClick={() => setTemplateDialogOpen(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates
                  .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((template) => (
                    <Card key={template.id} className="group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditTemplate(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteTemplateMutation.mutate(template.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(template.created_at), 'MMM d, yyyy')}
                          </span>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                            useTemplate(template);
                            setCampaignDialogOpen(true);
                          }}>
                            <Copy className="h-3 w-3" />
                            Use
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setGroupDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Group
              </Button>
            </div>

            {groupsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groups.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No groups yet</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    Create contact groups to organize your leads and patients for targeted campaigns.
                  </p>
                  <Button onClick={() => setGroupDialogOpen(true)} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups
                  .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((group) => (
                    <Card key={group.id} className="group/card">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: group.color }}
                            />
                            <CardTitle className="text-base">{group.name}</CardTitle>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditGroup(group)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteGroupMutation.mutate(group.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {group.description && (
                          <CardDescription>{group.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1 text-sm">
                            <UserCheck className="h-4 w-4 text-blue-500" />
                            <span>{group.lead_count} Leads</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4 text-green-500" />
                            <span>{group.patient_count} Patients</span>
                          </div>
                          {isSuperAdmin && (group.user_count || 0) > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="h-4 w-4 text-purple-500" />
                              <span>{group.user_count} Users</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full mt-4 gap-1"
                          onClick={() => {
                            setSelectedGroup(group);
                            setGroupMembersDialogOpen(true);
                          }}
                        >
                          <Users className="h-3 w-3" />
                          Manage Members
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Template Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={(open) => {
          setTemplateDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
            resetTemplateForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                Create a reusable email template for your campaigns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Email, Follow-up..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to our clinic!"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Content</Label>
                <RichTextEditor
                  content={templateForm.content}
                  onChange={(content) => setTemplateForm(prev => ({ ...prev, content }))}
                  placeholder="Write your email content here... Use {{name}} for personalization."
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{{name}}"}, {"{{email}}"}, {"{{phone}}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleTemplateSubmit}
                disabled={!templateForm.name || !templateForm.subject || !templateForm.content}
              >
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={(open) => {
          setGroupDialogOpen(open);
          if (!open) {
            setEditingGroup(null);
            resetGroupForm();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
              <DialogDescription>
                Create a contact group to organize leads and patients.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VIP Patients, Cold Leads..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description (optional)</Label>
                <Textarea
                  id="group-description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this group..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="group-color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={groupForm.color}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleGroupSubmit}
                disabled={!groupForm.name}
              >
                {editingGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Members Dialog */}
        <Dialog open={groupMembersDialogOpen} onOpenChange={setGroupMembersDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedGroup?.color }}
                />
                {selectedGroup?.name} - Members
              </DialogTitle>
              <DialogDescription>
                Add or remove leads and patients from this group.
              </DialogDescription>
            </DialogHeader>
            <GroupMembersManager 
              group={selectedGroup} 
              leads={leads}
              patients={patients}
              onClose={() => setGroupMembersDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Campaign Dialog */}
        <Dialog open={campaignDialogOpen} onOpenChange={(open) => {
          setCampaignDialogOpen(open);
          if (!open) resetCampaignForm();
        }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
              <DialogDescription>
                Step {campaignStep} of 3: {campaignStep === 1 ? 'Campaign Details' : campaignStep === 2 ? 'Select Recipients' : 'Review & Send'}
              </DialogDescription>
            </DialogHeader>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === campaignStep
                      ? 'bg-primary text-primary-foreground'
                      : step < campaignStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < campaignStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
              ))}
            </div>

            {/* Step 1: Campaign Details */}
            {campaignStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., January Newsletter, Promo Announcement..."
                  />
                </div>

                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Use Template (optional)</Label>
                    <Select onValueChange={(value) => {
                      const template = templates.find(t => t.id === value);
                      if (template) useTemplate(template);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Email Subject</Label>
                  <Input
                    id="campaign-subject"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Special offer just for you!"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Content</Label>
                  <RichTextEditor
                    content={campaignForm.content}
                    onChange={(content) => setCampaignForm(prev => ({ ...prev, content }))}
                    placeholder="Write your email content here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar to format text, add links, and insert images. Use {"{{name}}"} for personalization.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Select Recipients */}
            {campaignStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={recipientSource === 'individual' ? 'default' : 'outline'}
                    onClick={() => setRecipientSource('individual')}
                  >
                    Individual Selection
                  </Button>
                  <Button
                    size="sm"
                    variant={recipientSource === 'lead_status' ? 'default' : 'outline'}
                    onClick={() => setRecipientSource('lead_status')}
                  >
                    By Lead Status
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      size="sm"
                      variant={recipientSource === 'organization' ? 'default' : 'outline'}
                      onClick={() => setRecipientSource('organization')}
                    >
                      By Organization
                    </Button>
                  )}
                  {groups.length > 0 && (
                    <Button
                      size="sm"
                      variant={recipientSource === 'group' ? 'default' : 'outline'}
                      onClick={() => setRecipientSource('group')}
                    >
                      By Group
                    </Button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  {recipientSource === 'organization' && isSuperAdmin && (
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Select value={selectedOrganizationId || "all"} onValueChange={(val) => setSelectedOrganizationId(val === "all" ? "" : val)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="All organizations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Organizations</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {recipientSource === 'lead_status' && (
                    <div className="space-y-2">
                      <Label>Lead Status</Label>
                      <Select value={selectedLeadStatus} onValueChange={setSelectedLeadStatus}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {recipientSource === 'group' && (
                    <div className="space-y-2">
                      <Label>Group</Label>
                      <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllLeads}>
                    Select All Leads ({leads.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={selectAllPatients}>
                    Select All Patients ({patients.length})
                  </Button>
                  {isSuperAdmin && (
                    <Button size="sm" variant="outline" onClick={selectAllUsers}>
                      Select All Users ({systemUsers.length})
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRecipients([])}>
                    Clear Selection
                  </Button>
                </div>

                {/* Selected count */}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">{selectedRecipients.length} recipients selected</p>
                </div>

                {/* Recipients lists */}
                <div className={`grid gap-4 ${isSuperAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                  {/* Leads */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Leads ({leads.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {leads.map((lead: any) => (
                            <div 
                              key={lead.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedRecipients.find(r => r.id === lead.id && r.type === 'lead')
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => toggleRecipient({
                                id: lead.id,
                                email: lead.email,
                                name: `${lead.first_name} ${lead.last_name}`,
                                type: 'lead',
                                organization_name: lead.organization?.name,
                                status: lead.status
                              })}
                            >
                              <Checkbox 
                                checked={!!selectedRecipients.find(r => r.id === lead.id && r.type === 'lead')}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {lead.first_name} {lead.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                                {isSuperAdmin && lead.organization?.name && (
                                  <p className="text-xs text-primary/70 truncate">{lead.organization.name}</p>
                                )}
                              </div>
                              <Badge className={`text-xs shrink-0 ${getLeadStatusColor(lead.status)}`}>
                                {lead.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Patients */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Patients ({patients.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {patients.map((patient: any) => (
                            <div 
                              key={patient.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedRecipients.find(r => r.id === patient.id && r.type === 'patient')
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => toggleRecipient({
                                id: patient.id,
                                email: patient.email,
                                name: `${patient.first_name} ${patient.last_name}`,
                                type: 'patient',
                                organization_name: patient.organization?.name
                              })}
                            >
                              <Checkbox 
                                checked={!!selectedRecipients.find(r => r.id === patient.id && r.type === 'patient')}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                                {isSuperAdmin && patient.organization?.name && (
                                  <p className="text-xs text-primary/70 truncate">{patient.organization.name}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Users (Super Admin only) */}
                  {isSuperAdmin && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          System Users ({systemUsers.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {systemUsers.map((sysUser: any) => (
                              <div 
                                key={sysUser.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedRecipients.find(r => r.id === sysUser.id && r.type === 'user')
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleRecipient({
                                  id: sysUser.id,
                                  email: sysUser.email,
                                  name: `${sysUser.first_name} ${sysUser.last_name}`,
                                  type: 'user',
                                  organization_name: sysUser.organization?.name
                                })}
                              >
                                <Checkbox 
                                  checked={!!selectedRecipients.find(r => r.id === sysUser.id && r.type === 'user')}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {sysUser.first_name} {sysUser.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{sysUser.email}</p>
                                  {sysUser.organization?.name && (
                                    <p className="text-xs text-primary/70 truncate">{sysUser.organization.name}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {campaignStep === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Campaign Name</Label>
                        <p className="font-medium">{campaignForm.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Subject</Label>
                        <p className="font-medium">{campaignForm.subject}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Content Preview</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                        <p className="whitespace-pre-wrap text-sm">{campaignForm.content}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Recipients ({selectedRecipients.length})</Label>
                      <div className="mt-2 flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                        {selectedRecipients.slice(0, 20).map((r) => (
                          <Badge key={`${r.type}-${r.id}`} variant="secondary">
                            {r.name}
                          </Badge>
                        ))}
                        {selectedRecipients.length > 20 && (
                          <Badge variant="outline">+{selectedRecipients.length - 20} more</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Hostinger SMTP Limits</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Your account can send approximately 1,000 emails per day. 
                        Emails will be sent with a 2-second delay between each to avoid rate limiting.
                        Estimated time: ~{Math.ceil(selectedRecipients.length * 2 / 60)} minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {campaignStep > 1 && (
                <Button variant="outline" onClick={() => setCampaignStep(prev => prev - 1)}>
                  Back
                </Button>
              )}
              {campaignStep < 3 ? (
                <Button 
                  onClick={() => setCampaignStep(prev => prev + 1)}
                  disabled={
                    (campaignStep === 1 && (!campaignForm.name || !campaignForm.subject || !campaignForm.content)) ||
                    (campaignStep === 2 && selectedRecipients.length === 0)
                  }
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={() => createCampaignMutation.mutate()}
                  disabled={createCampaignMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Create Campaign
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={editCampaignDialogOpen} onOpenChange={(open) => {
          setEditCampaignDialogOpen(open);
          if (!open) {
            setEditingCampaign(null);
            setSelectedRecipients([]);
            setEditCampaignStep('content');
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update the campaign content and recipients
              </DialogDescription>
            </DialogHeader>

            {/* Step Navigation */}
            <div className="flex gap-2 border-b pb-4">
              <Button
                size="sm"
                variant={editCampaignStep === 'content' ? 'default' : 'outline'}
                onClick={() => setEditCampaignStep('content')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Content
              </Button>
              <Button
                size="sm"
                variant={editCampaignStep === 'recipients' ? 'default' : 'outline'}
                onClick={() => setEditCampaignStep('recipients')}
              >
                <Users className="h-4 w-4 mr-2" />
                Recipients ({selectedRecipients.length})
              </Button>
            </div>

            {/* Content Step */}
            {editCampaignStep === 'content' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-campaign-name">Campaign Name *</Label>
                  <Input
                    id="edit-campaign-name"
                    value={editCampaignForm.name}
                    onChange={(e) => setEditCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Valentine's Day Special"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-campaign-subject">Email Subject *</Label>
                  <Input
                    id="edit-campaign-subject"
                    value={editCampaignForm.subject}
                    onChange={(e) => setEditCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Special offer just for you!"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Content *</Label>
                  <RichTextEditor
                    content={editCampaignForm.content}
                    onChange={(content) => setEditCampaignForm(prev => ({ ...prev, content }))}
                    placeholder="Write your email content here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar to format text, add links, and insert images. Use {"{{name}}"} for personalization.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      if (editingCampaign) {
                        updateCampaignMutation.mutate({
                          campaignId: editingCampaign.id,
                          data: editCampaignForm
                        });
                      }
                    }}
                    disabled={updateCampaignMutation.isPending || !editCampaignForm.name || !editCampaignForm.subject || !editCampaignForm.content}
                  >
                    {updateCampaignMutation.isPending ? "Saving..." : "Save Content"}
                  </Button>
                </div>
              </div>
            )}

            {/* Recipients Step */}
            {editCampaignStep === 'recipients' && (
              <div className="space-y-4">
                {/* Organization filter for super admin */}
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label>Filter by Clinic</Label>
                    <Select value={selectedOrganizationId || "all"} onValueChange={(val) => setSelectedOrganizationId(val === "all" ? "" : val)}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="All Clinics" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clinics</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllLeads}>
                    Select All Leads ({leads.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={selectAllPatients}>
                    Select All Patients ({patients.length})
                  </Button>
                  {isSuperAdmin && (
                    <Button size="sm" variant="outline" onClick={selectAllUsers}>
                      Select All Users ({systemUsers.length})
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRecipients([])}>
                    Clear Selection
                  </Button>
                </div>

                {/* Selected count */}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">{selectedRecipients.length} recipients selected</p>
                </div>

                {/* Recipients lists */}
                <div className={`grid gap-4 ${isSuperAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                  {/* Leads */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Leads ({leads.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {leads.map((lead: any) => (
                            <div 
                              key={lead.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedRecipients.find(r => r.id === lead.id && r.type === 'lead')
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => toggleRecipient({
                                id: lead.id,
                                email: lead.email,
                                name: `${lead.first_name} ${lead.last_name}`,
                                type: 'lead',
                                organization_name: lead.organization?.name,
                                status: lead.status
                              })}
                            >
                              <Checkbox 
                                checked={!!selectedRecipients.find(r => r.id === lead.id && r.type === 'lead')}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {lead.first_name} {lead.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                                {isSuperAdmin && lead.organization?.name && (
                                  <p className="text-xs text-primary/70 truncate">{lead.organization.name}</p>
                                )}
                              </div>
                              <Badge className={`text-xs shrink-0 ${getLeadStatusColor(lead.status)}`}>
                                {lead.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Patients */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Patients ({patients.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {patients.map((patient: any) => (
                            <div 
                              key={patient.id}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedRecipients.find(r => r.id === patient.id && r.type === 'patient')
                                  ? 'bg-primary/10 border border-primary/20'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => toggleRecipient({
                                id: patient.id,
                                email: patient.email,
                                name: `${patient.first_name} ${patient.last_name}`,
                                type: 'patient',
                                organization_name: patient.organization?.name
                              })}
                            >
                              <Checkbox 
                                checked={!!selectedRecipients.find(r => r.id === patient.id && r.type === 'patient')}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {patient.first_name} {patient.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                                {isSuperAdmin && patient.organization?.name && (
                                  <p className="text-xs text-primary/70 truncate">{patient.organization.name}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Users (Super Admin only) */}
                  {isSuperAdmin && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          System Users ({systemUsers.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {systemUsers.map((sysUser: any) => (
                              <div 
                                key={sysUser.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedRecipients.find(r => r.id === sysUser.id && r.type === 'user')
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => toggleRecipient({
                                  id: sysUser.id,
                                  email: sysUser.email,
                                  name: `${sysUser.first_name} ${sysUser.last_name}`,
                                  type: 'user',
                                  organization_name: sysUser.organization?.name
                                })}
                              >
                                <Checkbox 
                                  checked={!!selectedRecipients.find(r => r.id === sysUser.id && r.type === 'user')}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {sysUser.first_name} {sysUser.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{sysUser.email}</p>
                                  {sysUser.organization?.name && (
                                    <p className="text-xs text-primary/70 truncate">{sysUser.organization.name}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      if (editingCampaign) {
                        updateCampaignRecipientsMutation.mutate({
                          campaignId: editingCampaign.id,
                          recipients: selectedRecipients
                        });
                      }
                    }}
                    disabled={updateCampaignRecipientsMutation.isPending || selectedRecipients.length === 0}
                  >
                    {updateCampaignRecipientsMutation.isPending ? "Saving..." : "Save Recipients"}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditCampaignDialogOpen(false);
                setEditingCampaign(null);
                setSelectedRecipients([]);
                setEditCampaignStep('content');
              }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Campaign Detail Dialog */}
        <CampaignDetailDialog
          campaign={detailCampaign}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onEdit={(campaign) => {
            setDetailDialogOpen(false);
            openEditCampaign(campaign);
          }}
        />

        {/* Delete Campaign Dialog */}
        <DeleteConfirmDialog
          open={deleteCampaignDialogOpen}
          onOpenChange={setDeleteCampaignDialogOpen}
          onConfirm={() => {
            if (deleteCampaignId) {
              deleteCampaignMutation.mutate(deleteCampaignId);
            }
          }}
          title="Kampanyayı silmek istediğinize emin misiniz?"
          description="Bu işlem geri alınamaz. Kampanya ve tüm alıcı kayıtları kalıcı olarak silinecektir."
          isDeleting={deleteCampaignMutation.isPending}
        />
      </div>
    </>
  );
}

// Group Members Manager Component
function GroupMembersManager({ 
  group, 
  leads, 
  patients,
  onClose 
}: { 
  group: ContactGroup | null; 
  leads: any[];
  patients: any[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leadMembers = [] } = useQuery({
    queryKey: ['lead-group-members', group?.id],
    queryFn: async () => {
      if (!group) return [];
      const { data, error } = await supabase
        .from('lead_group_members')
        .select('lead_id')
        .eq('group_id', group.id);
      if (error) throw error;
      return data.map(m => m.lead_id);
    },
    enabled: !!group
  });

  const { data: patientMembers = [] } = useQuery({
    queryKey: ['patient-group-members', group?.id],
    queryFn: async () => {
      if (!group) return [];
      const { data, error } = await supabase
        .from('patient_group_members')
        .select('patient_id')
        .eq('group_id', group.id);
      if (error) throw error;
      return data.map(m => m.patient_id);
    },
    enabled: !!group
  });

  const toggleLeadMember = async (leadId: string) => {
    if (!group) return;
    
    const isMember = leadMembers.includes(leadId);
    
    if (isMember) {
      const { error } = await supabase
        .from('lead_group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('lead_id', leadId);
      if (error) {
        toast({ title: "Error removing lead", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('lead_group_members')
        .insert({ group_id: group.id, lead_id: leadId, added_by: user?.id });
      if (error) {
        toast({ title: "Error adding lead", description: error.message, variant: "destructive" });
        return;
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['lead-group-members', group.id] });
    queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
  };

  const togglePatientMember = async (patientId: string) => {
    if (!group) return;
    
    const isMember = patientMembers.includes(patientId);
    
    if (isMember) {
      const { error } = await supabase
        .from('patient_group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('patient_id', patientId);
      if (error) {
        toast({ title: "Error removing patient", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('patient_group_members')
        .insert({ group_id: group.id, patient_id: patientId, added_by: user?.id });
      if (error) {
        toast({ title: "Error adding patient", description: error.message, variant: "destructive" });
        return;
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['patient-group-members', group.id] });
    queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
  };

  const filteredLeads = leads.filter((l: any) => 
    `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = patients.filter((p: any) => 
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {filteredLeads.map((lead: any) => (
                  <div 
                    key={lead.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      leadMembers.includes(lead.id)
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleLeadMember(lead.id)}
                  >
                    <Checkbox checked={leadMembers.includes(lead.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Patients */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {filteredPatients.map((patient: any) => (
                  <div 
                    key={patient.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      patientMembers.includes(patient.id)
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => togglePatientMember(patient.id)}
                  >
                    <Checkbox checked={patientMembers.includes(patient.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}
