import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  User, Users, PhoneOff, AlertCircle, Trash2, Eye, Mail 
} from 'lucide-react';
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
  patient?: { first_name: string; last_name: string; phone: string } | null;
  lead?: { first_name: string; last_name: string; phone: string } | null;
  creator?: { first_name: string; last_name: string } | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Super admin sees ALL data across all organizations
      const [remindersRes, patientsRes, leadsRes] = await Promise.all([
        supabase
          .from('reminders')
          .select(`
            *,
            patient:patients(first_name, last_name, phone),
            lead:leads(first_name, last_name, phone),
            creator:profiles!reminders_created_by_fkey(first_name, last_name)
          `)
          .order('reminder_date', { ascending: true }),
        supabase
          .from('patients')
          .select('id, first_name, last_name, phone')
          .order('first_name'),
        supabase
          .from('leads')
          .select('id, first_name, last_name, phone, status')
          .not('status', 'eq', 'converted_to_patient')
          .order('first_name'),
      ]);

      if (remindersRes.error) throw remindersRes.error;
      if (patientsRes.error) throw patientsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      setReminders((remindersRes.data || []) as Reminder[]);
      setPatients(patientsRes.data || []);
      setLeads(leadsRes.data || []);
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
      // Create a proper local date and convert to ISO string
      const localDate = new Date(`${form.reminder_date}T${form.reminder_time}:00`);
      const reminderDateTime = localDate.toISOString();
      
      const { error } = await supabase.from('reminders').insert([{
        organization_id: profile?.organization_id,
        created_by: profile?.id,
        patient_id: form.target_type === 'patient' ? form.target_id : null,
        lead_id: form.target_type === 'lead' ? form.target_id : null,
        reminder_type: form.reminder_type,
        reminder_date: reminderDateTime,
        title: form.title,
        notes: form.notes || null,
        notify_all_admins: form.notify_all_admins,
      }]);

      if (error) throw error;

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
    
    return matchesSearch && matchesStatus && matchesType;
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
    });
    setIsDialogOpen(true);
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
                    Email Notification
                  </Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notify_type"
                        checked={!form.notify_all_admins}
                        onChange={() => setForm({ ...form, notify_all_admins: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Only me (creator)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="notify_type"
                        checked={form.notify_all_admins}
                        onChange={() => setForm({ ...form, notify_all_admins: true })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">All Super Admins</span>
                    </label>
                  </div>
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
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Patients</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reminders" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                        onDelete={() => { setDeletingId(reminder.id); setDeleteDialogOpen(true); }}
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
                        onDelete={() => { setDeletingId(reminder.id); setDeleteDialogOpen(true); }}
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

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hastalar ({patients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patients.map(patient => (
                    <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                        <p className="text-sm text-muted-foreground">{patient.phone}</p>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leads ({leads.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <p className="text-sm text-muted-foreground">{lead.phone}</p>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

function ReminderCard({ 
  reminder, 
  onComplete, 
  onDelete 
}: { 
  reminder: Reminder; 
  onComplete: () => void; 
  onDelete: () => void;
}) {
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
        <div className="flex gap-2">
          {isPending && (
            <Button size="sm" variant="outline" onClick={onComplete}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
