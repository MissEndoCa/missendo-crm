import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Bell, Plus, Phone, Calendar, CheckCircle, Clock, 
  User, Users, PhoneOff, AlertCircle, Trash2, Mail, Pencil, Building2,
  Eye, Check, PhoneCall, PhoneMissed, X
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CallLog {
  id: string;
  reminder_id: string;
  call_result: string;
  notes: string | null;
  called_by: string | null;
  called_at: string;
  caller?: { first_name: string; last_name: string } | null;
}

interface Reminder {
  id: string;
  reminder_type: string;
  reminder_date: string;
  title: string;
  notes: string | null;
  status: string;
  email_sent_at: string | null;
  completed_at: string | null;
  created_at: string;
  organization_id: string;
  patient_id: string | null;
  lead_id: string | null;
  notify_all_admins: boolean | null;
  patient?: { first_name: string; last_name: string; phone: string; organization_id: string } | null;
  lead?: { first_name: string; last_name: string; phone: string; organization_id: string } | null;
  creator?: { first_name: string; last_name: string } | null;
  organization?: { name: string } | null;
  call_logs?: CallLog[];
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  organization_id: string;
  organization?: { name: string } | null;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  organization_id: string;
  organization?: { name: string } | null;
}

interface Organization {
  id: string;
  name: string;
}

interface SuperAdmin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const REMINDER_TYPES = [
  { value: 'call_back', label: 'Call Back', icon: Phone },
  { value: 'follow_up', label: 'Follow Up', icon: Calendar },
  { value: 'unreachable', label: 'Unreachable', icon: PhoneOff },
  { value: 'appointment', label: 'Appointment', icon: Calendar },
  { value: 'custom', label: 'Custom', icon: Bell },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-warning text-warning-foreground' },
  sent: { label: 'Sent', color: 'bg-primary text-primary-foreground' },
  completed: { label: 'Completed', color: 'bg-success text-success-foreground' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive text-destructive-foreground' },
};

export default function Reminders() {
  const { profile, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOrgFilter, setPatientOrgFilter] = useState<string>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadOrgFilter, setLeadOrgFilter] = useState<string>('all');
  
  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState('reminders');
  
  const [form, setForm] = useState({
    target_type: 'patient' as 'patient' | 'lead',
    target_id: '',
    reminder_type: 'call_back',
    reminder_date: '',
    reminder_time: '09:00',
    title: '',
    notes: '',
    notify_all_admins: false,
    selected_admins: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    reminder_type: 'call_back',
    reminder_date: '',
    reminder_time: '09:00',
    title: '',
    notes: '',
    status: 'pending',
    notify_all_admins: false,
    selected_admins: [] as string[],
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remindersRes, patientsRes, leadsRes, orgsRes, callLogsRes, superAdminsRes, notifyUsersRes] = await Promise.all([
        supabase
          .from('reminders')
          .select(`
            *,
            patient:patients(first_name, last_name, phone, organization_id),
            lead:leads(first_name, last_name, phone, organization_id),
            creator:profiles!reminders_created_by_fkey(first_name, last_name),
            organization:organizations(name)
          `)
          .order('reminder_date', { ascending: true }),
        supabase
          .from('patients')
          .select('id, first_name, last_name, phone, organization_id, organization:organizations(name)')
          .order('first_name'),
        supabase
          .from('leads')
          .select('id, first_name, last_name, phone, status, organization_id, organization:organizations(name)')
          .not('status', 'eq', 'converted_to_patient')
          .order('first_name'),
        supabase
          .from('organizations')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('reminder_call_logs')
          .select(`
            *,
            caller:profiles!reminder_call_logs_called_by_fkey(first_name, last_name)
          `)
          .order('called_at', { ascending: false }),
        // Fetch super admin user_ids
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'super_admin'),
        // Fetch notify users for reminders
        supabase
          .from('reminder_notify_users')
          .select('reminder_id, user_id'),
      ]);

      if (remindersRes.error) throw remindersRes.error;
      if (patientsRes.error) throw patientsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (orgsRes.error) throw orgsRes.error;
      if (callLogsRes.error) throw callLogsRes.error;
      if (superAdminsRes.error) throw superAdminsRes.error;
      if (notifyUsersRes.error) throw notifyUsersRes.error;

      // Group call logs by reminder_id
      const callLogsByReminder: Record<string, CallLog[]> = {};
      (callLogsRes.data || []).forEach((log: CallLog) => {
        if (!callLogsByReminder[log.reminder_id]) {
          callLogsByReminder[log.reminder_id] = [];
        }
        callLogsByReminder[log.reminder_id].push(log);
      });

      // Attach call logs to reminders
      const remindersWithLogs = (remindersRes.data || []).map((reminder: Reminder) => ({
        ...reminder,
        call_logs: callLogsByReminder[reminder.id] || [],
      }));

      setReminders(remindersWithLogs as Reminder[]);
      setPatients((patientsRes.data || []) as Patient[]);
      setLeads((leadsRes.data || []) as Lead[]);
      setOrganizations(orgsRes.data || []);
      
      // Fetch super admin profiles separately
      const superAdminIds = (superAdminsRes.data || []).map((r: { user_id: string }) => r.user_id);
      if (superAdminIds.length > 0) {
        const { data: adminProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', superAdminIds)
          .eq('is_active', true);
        
        if (!profilesError && adminProfiles) {
          setSuperAdmins(adminProfiles as SuperAdmin[]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.target_id || !form.reminder_date || !form.title) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const localDate = new Date(`${form.reminder_date}T${form.reminder_time}:00`);
      const reminderDateTime = localDate.toISOString();
      
      const { data: newReminder, error } = await supabase.from('reminders').insert([{
        organization_id: profile?.organization_id,
        created_by: profile?.id,
        patient_id: form.target_type === 'patient' ? form.target_id : null,
        lead_id: form.target_type === 'lead' ? form.target_id : null,
        reminder_type: form.reminder_type,
        reminder_date: reminderDateTime,
        title: form.title,
        notes: form.notes || null,
        notify_all_admins: form.notify_all_admins,
      }]).select('id').single();

      if (error) throw error;

      // Insert selected admins to notify
      if (form.selected_admins.length > 0 && newReminder) {
        const notifyInserts = form.selected_admins.map(userId => ({
          reminder_id: newReminder.id,
          user_id: userId,
        }));
        await supabase.from('reminder_notify_users').insert(notifyInserts);
      }

      toast({
        title: 'Success',
        description: 'Reminder created successfully',
      });

      setIsDialogOpen(false);
      setForm({
        target_type: 'patient',
        target_id: '',
        reminder_type: 'call_back',
        reminder_date: '',
        reminder_time: '09:00',
        title: '',
        notes: '',
        notify_all_admins: false,
        selected_admins: [],
      });
      fetchData();
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reminder',
        variant: 'destructive',
      });
    }
  };

  const handleEditReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingReminder || !editForm.reminder_date || !editForm.title) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const localDate = new Date(`${editForm.reminder_date}T${editForm.reminder_time}:00`);
      const reminderDateTime = localDate.toISOString();
      
      const updateData: Record<string, unknown> = {
        reminder_type: editForm.reminder_type,
        reminder_date: reminderDateTime,
        title: editForm.title,
        notes: editForm.notes || null,
        status: editForm.status,
        notify_all_admins: editForm.notify_all_admins,
      };

      // Reset completed_at if status is no longer completed
      if (editForm.status !== 'completed') {
        updateData.completed_at = null;
      } else if (editForm.status === 'completed' && editingReminder.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reminders')
        .update(updateData)
        .eq('id', editingReminder.id);

      if (error) throw error;

      // Update selected admins to notify
      // First delete existing
      await supabase
        .from('reminder_notify_users')
        .delete()
        .eq('reminder_id', editingReminder.id);
      
      // Then insert new ones
      if (editForm.selected_admins.length > 0) {
        const notifyInserts = editForm.selected_admins.map(userId => ({
          reminder_id: editingReminder.id,
          user_id: userId,
        }));
        await supabase.from('reminder_notify_users').insert(notifyInserts);
      }

      toast({
        title: 'Success',
        description: 'Reminder updated successfully',
      });

      setIsEditDialogOpen(false);
      setEditingReminder(null);
      fetchData();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reminder',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = async (reminder: Reminder) => {
    const reminderDate = new Date(reminder.reminder_date);
    setEditingReminder(reminder);
    
    // Fetch existing notify users for this reminder
    const { data: notifyUsers } = await supabase
      .from('reminder_notify_users')
      .select('user_id')
      .eq('reminder_id', reminder.id);
    
    const existingAdmins = (notifyUsers || []).map(n => n.user_id);
    
    setEditForm({
      reminder_type: reminder.reminder_type,
      reminder_date: format(reminderDate, 'yyyy-MM-dd'),
      reminder_time: format(reminderDate, 'HH:mm'),
      title: reminder.title,
      notes: reminder.notes || '',
      status: reminder.status,
      notify_all_admins: reminder.notify_all_admins || false,
      selected_admins: existingAdmins,
    });
    setIsEditDialogOpen(true);
  };

  const handleMarkComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reminder marked as completed',
      });
      fetchData();
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reminder deleted',
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reminder',
        variant: 'destructive',
      });
    }
  };

  // Filter reminders
  const filteredReminders = reminders.filter((reminder) => {
    const targetName = reminder.patient 
      ? `${reminder.patient.first_name} ${reminder.patient.last_name}`
      : reminder.lead 
        ? `${reminder.lead.first_name} ${reminder.lead.last_name}`
        : '';
    
    const matchesSearch = searchTerm === '' || 
      targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reminder.status === statusFilter;
    const matchesType = typeFilter === 'all' || reminder.reminder_type === typeFilter;
    const matchesOrg = organizationFilter === 'all' || reminder.organization_id === organizationFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesOrg;
  });

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const matchesSearch = patientSearch === '' || 
      fullName.includes(patientSearch.toLowerCase()) ||
      patient.phone.includes(patientSearch);
    const matchesOrg = patientOrgFilter === 'all' || patient.organization_id === patientOrgFilter;
    return matchesSearch && matchesOrg;
  });

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    const matchesSearch = leadSearch === '' || 
      fullName.includes(leadSearch.toLowerCase()) ||
      lead.phone.includes(leadSearch);
    const matchesOrg = leadOrgFilter === 'all' || lead.organization_id === leadOrgFilter;
    return matchesSearch && matchesOrg;
  });

  const pendingReminders = filteredReminders.filter(r => r.status === 'pending');
  const otherReminders = filteredReminders.filter(r => r.status !== 'pending');

  const quickCreateReminder = (targetType: 'patient' | 'lead', targetId: string, type: string) => {
    const target = targetType === 'patient' 
      ? patients.find(p => p.id === targetId)
      : leads.find(l => l.id === targetId);
    
    const typeLabel = REMINDER_TYPES.find(t => t.value === type)?.label || type;
    const targetName = target ? `${target.first_name} ${target.last_name}` : '';
    
    setForm({
      target_type: targetType,
      target_id: targetId,
      reminder_type: type,
      reminder_date: format(new Date(), 'yyyy-MM-dd'),
      reminder_time: '09:00',
      title: `${typeLabel} - ${targetName}`,
      notes: '',
      notify_all_admins: false,
      selected_admins: [],
    });
    setIsDialogOpen(true);
  };

  const handleAddCallLog = async (reminderId: string, callResult: string, notes?: string) => {
    try {
      const { error } = await supabase.from('reminder_call_logs').insert([{
        reminder_id: reminderId,
        call_result: callResult,
        notes: notes || null,
        called_by: profile?.id,
      }]);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Arama kaydı eklendi',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding call log:', error);
      toast({
        title: 'Hata',
        description: 'Arama kaydı eklenemedi',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reminders</h1>
            <p className="text-sm md:text-base text-muted-foreground">Patient and lead follow-up system</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Reminder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Person Type</Label>
                    <Select 
                      value={form.target_type} 
                      onValueChange={(value: 'patient' | 'lead') => setForm({ ...form, target_type: value, target_id: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reminder Type</Label>
                    <Select 
                      value={form.reminder_type} 
                      onValueChange={(value) => setForm({ ...form, reminder_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Select Person *</Label>
                  <Select 
                    value={form.target_id} 
                    onValueChange={(value) => setForm({ ...form, target_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.target_type === 'patient' 
                        ? patients.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name} - {p.phone}
                            </SelectItem>
                          ))
                        : leads.map(l => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.first_name} {l.last_name} - {l.phone}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={form.reminder_date}
                      onChange={(e) => setForm({ ...form, reminder_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={form.reminder_time}
                      onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Reminder title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta Bildirimi
                  </Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notify_type"
                        checked={!form.notify_all_admins && form.selected_admins.length === 0}
                        onChange={() => setForm({ ...form, notify_all_admins: false, selected_admins: [] })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Sadece ben (oluşturan)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notify_type"
                        checked={form.notify_all_admins}
                        onChange={() => setForm({ ...form, notify_all_admins: true, selected_admins: [] })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Tüm Super Adminler</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notify_type"
                        checked={!form.notify_all_admins && form.selected_admins.length > 0}
                        onChange={() => setForm({ ...form, notify_all_admins: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Seçili Super Adminler</span>
                    </label>
                  </div>
                  
                  {/* Super Admin Selection */}
                  {!form.notify_all_admins && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {superAdmins.map(admin => (
                        <label key={admin.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted rounded">
                          <input
                            type="checkbox"
                            checked={form.selected_admins.includes(admin.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, selected_admins: [...form.selected_admins, admin.id] });
                              } else {
                                setForm({ ...form, selected_admins: form.selected_admins.filter(id => id !== admin.id) });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{admin.first_name} {admin.last_name}</span>
                          <span className="text-xs text-muted-foreground">({admin.email})</span>
                        </label>
                      ))}
                      {superAdmins.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Super admin bulunamadı</p>
                      )}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Create Reminder
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Reminders</span>
              {pendingReminders.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingReminders.length}</Badge>
              )}
            </TabsTrigger>
            {/* HIDDEN: Patients and Leads tabs - uncomment to restore
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            */}
          </TabsList>

          <TabsContent value="reminders" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name or title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clinics</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {REMINDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pending Reminders */}
            {pendingReminders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <Clock className="w-5 h-5" />
                    Pending Reminders ({pendingReminders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingReminders.map(reminder => (
                      <ReminderCard 
                        key={reminder.id} 
                        reminder={reminder} 
                        onComplete={() => handleMarkComplete(reminder.id)}
                        onEdit={() => openEditDialog(reminder)}
                        onDelete={() => { setDeletingId(reminder.id); setDeleteDialogOpen(true); }}
                        onAddCallLog={handleAddCallLog}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Reminders */}
            {otherReminders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Other Reminders ({otherReminders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {otherReminders.map(reminder => (
                      <ReminderCard 
                        key={reminder.id} 
                        reminder={reminder} 
                        onComplete={() => handleMarkComplete(reminder.id)}
                        onEdit={() => openEditDialog(reminder)}
                        onDelete={() => { setDeletingId(reminder.id); setDeleteDialogOpen(true); }}
                        onAddCallLog={handleAddCallLog}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredReminders.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reminders found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HIDDEN: Patients and Leads TabsContent - uncomment to restore
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patients ({filteredPatients.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={patientOrgFilter} onValueChange={setPatientOrgFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clinics</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {filteredPatients.map(patient => (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                        <p className="text-sm text-muted-foreground">{patient.phone}</p>
                        {patient.organization && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {patient.organization.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => quickCreateReminder('patient', patient.id, 'call_back')}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Call</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => quickCreateReminder('patient', patient.id, 'follow_up')}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Follow Up</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => quickCreateReminder('patient', patient.id, 'unreachable')}
                        >
                          <PhoneOff className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Unreachable</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredPatients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No patients found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leads ({filteredLeads.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name or phone..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={leadOrgFilter} onValueChange={setLeadOrgFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Clinic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clinics</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {filteredLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <p className="text-sm text-muted-foreground">{lead.phone}</p>
                        {lead.organization && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {lead.organization.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => quickCreateReminder('lead', lead.id, 'call_back')}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Call</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => quickCreateReminder('lead', lead.id, 'follow_up')}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Follow Up</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => quickCreateReminder('lead', lead.id, 'unreachable')}
                        >
                          <PhoneOff className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Unreachable</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          */}
        </Tabs>

        {/* Edit Reminder Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditReminder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reminder Type</Label>
                  <Select 
                    value={editForm.reminder_type} 
                    onValueChange={(value) => setEditForm({ ...editForm, reminder_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={editForm.reminder_date}
                    onChange={(e) => setEditForm({ ...editForm, reminder_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={editForm.reminder_time}
                    onChange={(e) => setEditForm({ ...editForm, reminder_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Reminder title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-posta Bildirimi
                </Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_notify_type"
                      checked={!editForm.notify_all_admins && editForm.selected_admins.length === 0}
                      onChange={() => setEditForm({ ...editForm, notify_all_admins: false, selected_admins: [] })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Sadece oluşturan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_notify_type"
                      checked={editForm.notify_all_admins}
                      onChange={() => setEditForm({ ...editForm, notify_all_admins: true, selected_admins: [] })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Tüm Super Adminler</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_notify_type"
                      checked={!editForm.notify_all_admins && editForm.selected_admins.length > 0}
                      onChange={() => setEditForm({ ...editForm, notify_all_admins: false })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Seçili Super Adminler</span>
                  </label>
                </div>
                
                {/* Super Admin Selection */}
                {!editForm.notify_all_admins && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {superAdmins.map(admin => (
                      <label key={admin.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          checked={editForm.selected_admins.includes(admin.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({ ...editForm, selected_admins: [...editForm.selected_admins, admin.id] });
                            } else {
                              setEditForm({ ...editForm, selected_admins: editForm.selected_admins.filter(id => id !== admin.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{admin.first_name} {admin.last_name}</span>
                        <span className="text-xs text-muted-foreground">({admin.email})</span>
                      </label>
                    ))}
                    {superAdmins.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Super admin bulunamadı</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reminder? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}

const CALL_RESULT_LABELS: Record<string, { label: string; icon: typeof PhoneCall; color: string }> = {
  reached: { label: 'Ulaşıldı', icon: PhoneCall, color: 'text-green-600' },
  unreached: { label: 'Ulaşılamadı', icon: PhoneMissed, color: 'text-red-500' },
  no_answer: { label: 'Cevap Yok', icon: PhoneOff, color: 'text-orange-500' },
  busy: { label: 'Meşgul', icon: Phone, color: 'text-yellow-600' },
  wrong_number: { label: 'Yanlış Numara', icon: X, color: 'text-destructive' },
};

function ReminderCard({ 
  reminder, 
  onComplete, 
  onEdit,
  onDelete,
  onAddCallLog
}: { 
  reminder: Reminder; 
  onComplete: () => void; 
  onEdit: () => void;
  onDelete: () => void;
  onAddCallLog: (reminderId: string, callResult: string, notes?: string) => Promise<void>;
}) {
  const [isCallLogOpen, setIsCallLogOpen] = useState(false);
  const [callNotes, setCallNotes] = useState('');

  const targetName = reminder.patient 
    ? `${reminder.patient.first_name} ${reminder.patient.last_name}`
    : reminder.lead 
      ? `${reminder.lead.first_name} ${reminder.lead.last_name}`
      : 'Unknown';

  const targetPhone = reminder.patient?.phone || reminder.lead?.phone || '';
  const isPatient = !!reminder.patient;
  const isPending = reminder.status === 'pending';
  const isOverdue = isPending && new Date(reminder.reminder_date) < new Date();

  const typeInfo = REMINDER_TYPES.find(t => t.value === reminder.reminder_type);
  const TypeIcon = typeInfo?.icon || Bell;
  const statusInfo = STATUS_LABELS[reminder.status] || STATUS_LABELS.pending;

  const callLogs = reminder.call_logs || [];
  const reachedCount = callLogs.filter(l => l.call_result === 'reached').length;
  const unreachedCount = callLogs.filter(l => l.call_result !== 'reached').length;

  const handleQuickCall = async (result: string) => {
    await onAddCallLog(reminder.id, result, callNotes);
    setCallNotes('');
    setIsCallLogOpen(false);
  };

  return (
    <div className={`p-4 border rounded-lg ${isOverdue ? 'border-destructive bg-destructive/5' : 'bg-muted/30'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isPatient ? 'bg-primary/10' : 'bg-warning/10'}`}>
            <TypeIcon className={`w-5 h-5 ${isPatient ? 'text-primary' : 'text-warning'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{reminder.title}</h4>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">{targetName}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {isPatient ? 'Patient' : 'Lead'}
              </Badge>
            </p>
            <p className="text-sm text-muted-foreground">{targetPhone}</p>
            {reminder.organization && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {reminder.organization.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(reminder.reminder_date).toLocaleString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              })}
              {reminder.creator && ` • ${reminder.creator.first_name} ${reminder.creator.last_name}`}
            </p>
            {reminder.notes && (
              <p className="text-sm mt-2 text-muted-foreground">{reminder.notes}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Call Logs Popover */}
          <Popover open={isCallLogOpen} onOpenChange={setIsCallLogOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="relative">
                <Eye className="w-4 h-4 text-muted-foreground" />
                {callLogs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {callLogs.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Arama Kayıtları</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <PhoneCall className="w-3 h-3" /> {reachedCount}
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <PhoneMissed className="w-3 h-3" /> {unreachedCount}
                    </span>
                  </div>
                </div>

                {/* Add new call log */}
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Yeni arama kaydı ekle:</p>
                  <Textarea
                    placeholder="Not (opsiyonel)..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuickCall('reached')}>
                      <PhoneCall className="w-3 h-3 mr-1 text-green-600" /> Ulaşıldı
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuickCall('unreached')}>
                      <PhoneMissed className="w-3 h-3 mr-1 text-red-500" /> Ulaşılamadı
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleQuickCall('no_answer')}>
                      <PhoneOff className="w-3 h-3 mr-1 text-orange-500" /> Cevap Yok
                    </Button>
                  </div>
                </div>

                {/* Call log history */}
                {callLogs.length > 0 && (
                  <div className="border-t pt-3 space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs text-muted-foreground">Geçmiş aramalar:</p>
                    {callLogs.map((log) => {
                      const resultInfo = CALL_RESULT_LABELS[log.call_result] || CALL_RESULT_LABELS.unreached;
                      const ResultIcon = resultInfo.icon;
                      return (
                        <div key={log.id} className="text-xs p-2 bg-muted/50 rounded space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-1 font-medium ${resultInfo.color}`}>
                              <ResultIcon className="w-3 h-3" />
                              {resultInfo.label}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(log.called_at).toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {log.caller && (
                            <p className="text-muted-foreground">
                              {log.caller.first_name} {log.caller.last_name}
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-muted-foreground italic">{log.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {callLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Henüz arama kaydı yok
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {isPending && (
            <Button size="icon" variant="outline" onClick={onComplete} title="Tamamla">
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
