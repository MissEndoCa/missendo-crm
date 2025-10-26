import { useEffect, useState } from 'react';
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
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  no_contact: 'bg-gray-100 text-gray-800',
  appointment_scheduled: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  converted_to_patient: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  will_not_come: 'bg-red-100 text-red-800',
};

interface Organization {
  id: string;
  name: string;
}

export default function Leads() {
  const { profile, isSuperAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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

  useEffect(() => {
    loadLeads();
    if (isSuperAdmin) {
      loadOrganizations();
    }
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
        
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        const { error } = await supabase.from('leads').insert([leadData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Lead created successfully",
        });
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

  const filteredLeads = leads.filter(lead =>
    `${lead.first_name} ${lead.last_name} ${lead.email} ${lead.phone}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Leads Management</h1>
            <p className="text-muted-foreground mt-2">Track and manage your potential patients</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
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
                      placeholder="e.g., Facebook Ads, Google"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    />
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="organization_id">Assign to Organization</Label>
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
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="no_contact">No Contact</SelectItem>
                      <SelectItem value="appointment_scheduled">Appointment Scheduled</SelectItem>
                      <SelectItem value="converted_to_patient">Converted to Patient</SelectItem>
                      <SelectItem value="will_not_come">Will Not Come</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
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
                      placeholder="Enter reason why the patient won't come"
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
                    {selectedLead ? 'Update' : 'Create'} Lead
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search leads by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableCell>
                      <Badge className={statusColors[lead.status] || 'bg-gray-100'}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.source || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
