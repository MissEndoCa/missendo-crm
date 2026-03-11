import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Search, Phone, Mail, MapPin, UserPlus, RefreshCw, Loader2, Trash2, StickyNote, MessageSquarePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ColumnFilter } from '@/components/ColumnFilter';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  country: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  appointment_scheduled_date: string | null;
  will_come: boolean | null;
  will_not_come_reason: string | null;
  organization_id: string;
  assigned_by_missendo: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  contacted: { label: 'Contacted', color: 'bg-green-100 text-green-800 border-green-200' },
  no_contact: { label: 'No Contact', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  appointment_scheduled: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  converted_to_patient: { label: 'Became Patient', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  rejected: { label: 'Lost', color: 'bg-red-100 text-red-800 border-red-200' },
  will_not_come: { label: 'Will Not Come', color: 'bg-red-100 text-red-800 border-red-200' },
};

const editableStatuses = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'no_contact', label: 'No Contact' },
  { value: 'appointment_scheduled', label: 'Confirmed' },
  { value: 'rejected', label: 'Lost' },
  { value: 'will_not_come', label: 'Will Not Come' },
];

interface Organization {
  id: string;
  name: string;
}

export default function Leads() {
  const { profile, isSuperAdmin, isClinicAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [clinicFilter, setClinicFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [noteEditLead, setNoteEditLead] = useState<string | null>(null);
  const [noteEditValue, setNoteEditValue] = useState('');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    source: '',
    status: 'new' as string,
    notes: '',
    appointment_scheduled_date: '',
    will_come: null as boolean | null,
    will_not_come_reason: '',
    organization_id: '',
  });

  // Poll Facebook leads function
  const pollFacebookLeads = useCallback(async (showToast = true) => {
    if (isPolling) return;
    
    setIsPolling(true);
    try {
      const { data, error } = await supabase.functions.invoke('poll-facebook-leads');
      
      if (error) throw error;
      
      if (showToast) {
        if (data?.newLeadsCount > 0) {
          toast({
            title: "New Leads Added",
            description: `${data.newLeadsCount} new lead(s) synced from Facebook`,
          });
        } else {
          toast({
            title: "Lead Check Complete",
            description: "No new leads found",
          });
        }
      }
      
      await loadLeads();
    } catch (error) {
      console.error('Error polling Facebook leads:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to sync Facebook leads",
          variant: "destructive",
        });
      }
    } finally {
      setIsPolling(false);
    }
  }, [isPolling, toast]);

  useEffect(() => {
    loadLeads();
    loadOrganizations();
    
    pollingIntervalRef.current = setInterval(() => {
      pollFacebookLeads(false);
    }, 60000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [profile, isSuperAdmin]);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const loadLeads = async () => {
    if (!profile) return;

    try {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus as any })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast({ title: "Status updated" });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleNoteSave = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: noteEditValue || null })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: noteEditValue || null } : l));
      setNoteEditLead(null);
      toast({ title: "Note saved" });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.organization_id && !isSuperAdmin) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive",
      });
      return;
    }

    try {
      const leadData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone,
        country: formData.country || null,
        source: formData.source || null,
        status: formData.status,
        notes: formData.notes || null,
        appointment_scheduled_date: formData.appointment_scheduled_date || null,
        will_come: formData.will_come,
        will_not_come_reason: formData.will_not_come_reason || null,
        organization_id: isSuperAdmin && formData.organization_id ? formData.organization_id : profile?.organization_id,
        assigned_by_missendo: isSuperAdmin,
        created_by: profile?.id,
      };

      if (selectedLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', selectedLead.id);

        if (error) throw error;
        
        toast({ title: "Lead updated" });
      } else {
        const { error } = await supabase.from('leads').insert([leadData]);

        if (error) throw error;
        
        toast({ title: "Lead created" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Error",
        description: "Failed to save lead",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      country: '',
      source: '',
      status: 'new' as string,
      notes: '',
      appointment_scheduled_date: '',
      will_come: null,
      will_not_come_reason: '',
      organization_id: '',
    });
    setSelectedLead(null);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || '',
      phone: lead.phone,
      country: lead.country || '',
      source: lead.source || '',
      status: lead.status as any,
      notes: lead.notes || '',
      appointment_scheduled_date: lead.appointment_scheduled_date ? new Date(lead.appointment_scheduled_date).toISOString().split('T')[0] : '',
      will_come: lead.will_come,
      will_not_come_reason: lead.will_not_come_reason || '',
      organization_id: lead.organization_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleConvertToPatient = async (lead: Lead) => {
    if (isConverting) return;
    
    setIsConverting(true);
    try {
      const patientData = {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        country: lead.country,
        organization_id: lead.organization_id,
        lead_id: lead.id,
        created_by: profile?.id,
        notes: lead.notes,
      };

      const { error: patientError } = await supabase
        .from('patients')
        .insert([patientData]);

      if (patientError) throw patientError;

      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'converted_to_patient' })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      toast({
        title: "Success",
        description: `${lead.first_name} ${lead.last_name} converted to patient`,
      });

      loadLeads();
    } catch (error) {
      console.error('Error converting lead to patient:', error);
      toast({
        title: "Error",
        description: "Failed to convert lead to patient",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: "Lead deleted" });
      setDeleteTarget(null);
      loadLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" });
    }
  };

  // Derive filter options from loaded data
  const statusOptions = [...new Set(leads.map(l => l.status))].map(s => ({ 
    value: s, 
    label: statusConfig[s]?.label || s.replace(/_/g, ' ') 
  }));
  const clinicOptions = [...new Set(leads.map(l => l.organization_id))].map(id => ({
    value: id,
    label: organizations.find(o => o.id === id)?.name || id,
  }));
  const sourceOptions = [...new Set(leads.map(l => l.source).filter(Boolean))].map(s => ({ value: s!, label: s! }));
  const countryOptions = [...new Set(leads.map(l => l.country).filter(Boolean))].map(c => ({ value: c!, label: c! }));

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = `${lead.first_name} ${lead.last_name} ${lead.email} ${lead.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(lead.status);
    const matchesClinic = clinicFilter.length === 0 || clinicFilter.includes(lead.organization_id);
    const matchesSource = sourceFilter.length === 0 || (lead.source && sourceFilter.includes(lead.source));
    const matchesCountry = countryFilter.length === 0 || (lead.country && countryFilter.includes(lead.country));
    return matchesSearch && matchesStatus && matchesClinic && matchesSource && matchesCountry;
  });

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Lead Management</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Track and manage your potential patients</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => pollFacebookLeads(true)} 
              disabled={isPolling}
              className="flex-1 sm:flex-none"
            >
              {isPolling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isPolling ? 'Syncing...' : 'Sync Leads'}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      placeholder="e.g. Facebook Ads, Google"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    />
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="organization_id">Assign to Organization</Label>
                    {selectedLead ? (
                      <div className="space-y-1">
                        <Select value={formData.organization_id} disabled>
                          <SelectTrigger className="opacity-60">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Organization cannot be changed for existing leads</p>
                      </div>
                    ) : (
                      <Select value={formData.organization_id} onValueChange={(value) => setFormData({ ...formData, organization_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editableStatuses.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                      <SelectItem value="converted_to_patient">Became Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.status === 'appointment_scheduled' || formData.status === 'converted_to_patient') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="appointment_scheduled_date">Appointment Date</Label>
                      <Input
                        id="appointment_scheduled_date"
                        type="date"
                        value={formData.appointment_scheduled_date}
                        onChange={(e) => setFormData({ ...formData, appointment_scheduled_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Will the patient come?</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData.will_come === true}
                            onChange={() => setFormData({ ...formData, will_come: true, will_not_come_reason: '' })}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData.will_come === false}
                            onChange={() => setFormData({ ...formData, will_come: false })}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {formData.will_come === false && (
                  <div className="space-y-2">
                    <Label htmlFor="will_not_come_reason">Reason for Not Coming</Label>
                    <Textarea
                      id="will_not_come_reason"
                      value={formData.will_not_come_reason}
                      onChange={(e) => setFormData({ ...formData, will_not_come_reason: e.target.value })}
                      placeholder="Enter the reason the patient won't come"
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedLead ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <ColumnFilter title="Location" options={countryOptions} selectedValues={countryFilter} onFilterChange={setCountryFilter} />
                </TableHead>
                <TableHead>
                  <ColumnFilter title="Status" options={statusOptions} selectedValues={statusFilter} onFilterChange={setStatusFilter} />
                </TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>
                  <ColumnFilter title="Clinic" options={clinicOptions} selectedValues={clinicFilter} onFilterChange={setClinicFilter} />
                </TableHead>
                <TableHead>
                  <ColumnFilter title="Source" options={sourceOptions} selectedValues={sourceFilter} onFilterChange={setSourceFilter} />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(lead)}>
                    <TableCell className="font-medium">
                      {lead.first_name} {lead.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{lead.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.country && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{lead.country}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {lead.status === 'converted_to_patient' ? (
                        <Badge className={statusConfig[lead.status]?.color || 'bg-gray-100'}>
                          {statusConfig[lead.status]?.label || lead.status}
                        </Badge>
                      ) : (
                        <Select 
                          key={`status-${lead.id}-${lead.status}`}
                          value={lead.status} 
                          onValueChange={(value) => handleStatusChange(lead.id, value)}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs border-dashed">
                            <Badge className={`${statusConfig[lead.status]?.color || 'bg-gray-100'} text-xs px-1.5 py-0`}>
                              {statusConfig[lead.status]?.label || lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {editableStatuses.map(s => (
                              <SelectItem key={s.value} value={s.value}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${statusConfig[s.value]?.color.split(' ')[0]}`} />
                                  {s.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Popover 
                        open={noteEditLead === lead.id} 
                        onOpenChange={(open) => {
                          if (open) {
                            setNoteEditLead(lead.id);
                            setNoteEditValue(lead.notes || '');
                          } else {
                            setNoteEditLead(null);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs max-w-[120px]">
                            {lead.notes ? (
                              <>
                                <StickyNote className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate">{lead.notes.substring(0, 20)}{lead.notes.length > 20 ? '...' : ''}</span>
                              </>
                            ) : (
                              <>
                                <MessageSquarePlus className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Add note</span>
                              </>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3" align="start">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Note</Label>
                            <Textarea
                              value={noteEditValue}
                              onChange={(e) => setNoteEditValue(e.target.value)}
                              placeholder="Add a note about this lead..."
                              rows={3}
                              className="text-sm"
                              autoFocus
                            />
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => setNoteEditLead(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => handleNoteSave(lead.id)}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-sm">
                      {organizations.find(org => org.id === lead.organization_id)?.name || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.source || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {lead.status !== 'converted_to_patient' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); handleConvertToPatient(lead); }}
                            disabled={isConverting}
                            className="text-xs"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Convert to Patient
                          </Button>
                        )}
                        {(isSuperAdmin || isClinicAdmin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(lead); }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDeleteLead}
          title="Delete Lead"
          description={`Are you sure you want to delete the lead ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action cannot be undone.`}
        />
      </div>
    </Layout>
  );
}
