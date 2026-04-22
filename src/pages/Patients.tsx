import { useEffect, useState, useMemo } from 'react';
import { SimplePagination } from '@/components/SimplePagination';

const PATIENTS_PAGE_SIZE = 15;
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { convertToWebP } from '@/lib/imageUtils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Phone, Mail, Upload, X, Building2, Pencil, Trash2, FileText, DollarSign, PhoneCall, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PatientDetails } from '@/components/PatientDetails';
import { ColumnFilter } from '@/components/ColumnFilter';
import { SortableHeader, type SortDirection } from '@/components/SortableHeader';
import { PatientCard } from '@/components/PatientCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as XLSX from 'xlsx';
type CrmStatus = 'new_lead' | 'called_answered' | 'called_no_answer' | 'waiting_photos' | 'photos_received' | 'treatment_plan_sent' | 'follow_up' | 'confirmed' | 'completed' | 'lost';

const CRM_STATUS_CONFIG: Record<CrmStatus, { label: string; color: string; bgColor: string }> = {
  new_lead: { label: 'New Lead', color: 'text-slate-600', bgColor: 'bg-white border border-slate-300' },
  called_answered: { label: 'Answered - Hang Up', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  called_no_answer: { label: 'No Answer - Call Back', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  waiting_photos: { label: 'Waiting Photos', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  photos_received: { label: 'Case Under Review', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  treatment_plan_sent: { label: 'Treatment Plan Sent', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  follow_up: { label: 'Follow-up - Pending', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmed: { label: 'Confirmed - Deposit', color: 'text-green-700', bgColor: 'bg-green-100' },
  completed: { label: 'Completed', color: 'text-emerald-800', bgColor: 'bg-emerald-200' },
  lost: { label: 'Lost / Closed', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  country: string | null;
  medical_condition: string | null;
  photo_url: string | null;
  created_at: string;
  organization_id: string;
  lead_id: string | null;
  crm_status: CrmStatus | null;
  organizations?: {
    name: string;
  } | null;
  patient_treatments?: {
    treatments: {
      name: string;
    } | null;
  }[];
}
interface Organization {
  id: string;
  name: string;
}
export default function Patients() {
  const {
    profile,
    isSuperAdmin,
    user,
    loading: authLoading
  } = useAuth();
  const isMobile = useIsMobile();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicFilter, setClinicFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    country: '',
    address: '',
    medical_condition: '',
    allergies: '',
    notes: '',
    photo_url: '',
    has_companion: false,
    companion_first_name: '',
    companion_last_name: '',
    companion_phone: '',
    companion_id_number: '',
    organization_id: '',
    estimated_price: '',
    final_price: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFromLead, setIsFromLead] = useState(false);
  const [callCounts, setCallCounts] = useState<Record<string, { count: number; lastCallAt: string | null; lastResult: string | null }>>({});
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    loadPatients();
    loadCallCounts();
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [authLoading, user, isSuperAdmin, profile?.organization_id]);
  const loadOrganizations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('organizations').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };
  const loadPatients = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase.from('patients').select('*, organizations(name), patient_treatments(treatments(name)), lead_id, crm_status').order('created_at', {
        ascending: false
      });

      if (!isSuperAdmin) {
        const orgId = profile?.organization_id;
        if (!orgId) {
          setPatients([]);
          toast({
            title: "Error",
            description: "You must be assigned to an organization",
            variant: "destructive"
          });
          return;
        }

        query = query.eq('organization_id', orgId);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCallCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('reminder_call_logs')
        .select('id, called_at, call_result, reminder_id, reminders!inner(patient_id)')
        .order('called_at', { ascending: false });

      if (error) throw error;

      const counts: Record<string, { count: number; lastCallAt: string | null; lastResult: string | null }> = {};
      (data || []).forEach((log: any) => {
        const patientId = log.reminders?.patient_id;
        if (!patientId) return;
        if (!counts[patientId]) {
          counts[patientId] = { count: 0, lastCallAt: log.called_at, lastResult: log.call_result };
        }
        counts[patientId].count++;
      });
      setCallCounts(counts);
    } catch (error) {
      console.error('Error loading call counts:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData({
      ...formData,
      photo_url: ''
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive"
      });
      return;
    }
    try {
      let photoUrl = formData.photo_url;

      // Upload photo if a new file is selected
      if (photoFile) {
        const convertedPhoto = await convertToWebP(photoFile);
        const patientId = selectedPatient?.id || crypto.randomUUID();
        const fileExt = convertedPhoto.name.split('.').pop();
        const fileName = `${patientId}/${Date.now()}.${fileExt}`;
        const {
          error: uploadError
        } = await supabase.storage.from('patient-photos').upload(fileName, convertedPhoto, {
          upsert: true
        });
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('patient-photos').getPublicUrl(fileName);
        photoUrl = publicUrl;
      }
      const patientData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        photo_url: photoUrl || null,
        organization_id: isSuperAdmin && formData.organization_id ? formData.organization_id : profile.organization_id,
        created_by: profile.id,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        country: formData.country || null,
        address: formData.address || null,
        medical_condition: formData.medical_condition || null,
        allergies: formData.allergies || null,
        notes: formData.notes || null,
        has_companion: formData.has_companion || false,
        companion_first_name: formData.has_companion ? formData.companion_first_name : null,
        companion_last_name: formData.has_companion ? formData.companion_last_name : null,
        companion_phone: formData.has_companion ? formData.companion_phone : null,
        companion_id_number: formData.has_companion ? formData.companion_id_number : null,
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : 0,
        final_price: formData.final_price ? parseFloat(formData.final_price) : 0
      };
      if (selectedPatient) {
        const {
          error
        } = await supabase.from('patients').update(patientData).eq('id', selectedPatient.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Patient updated successfully"
        });
      } else {
        const {
          error
        } = await supabase.from('patients').insert([patientData]);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Patient created successfully"
        });
      }
      setIsDialogOpen(false);
      resetForm();
      loadPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: "Failed to save patient",
        variant: "destructive"
      });
    }
  };
  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      country: '',
      address: '',
      medical_condition: '',
      allergies: '',
      notes: '',
      photo_url: '',
      has_companion: false,
      companion_first_name: '',
      companion_last_name: '',
      companion_phone: '',
      companion_id_number: '',
      organization_id: profile?.organization_id || '',
      estimated_price: '',
      final_price: ''
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setSelectedPatient(null);
    setIsFromLead(false);
  };
  const handleEdit = async (patient: Patient) => {
    setSelectedPatient(patient);

    // Fetch full patient details
    const {
      data
    } = await supabase.from('patients').select('*').eq('id', patient.id).single();
    if (data) {
      const patientData = data as any;
      setFormData({
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        email: patientData.email || '',
        phone: patientData.phone,
        date_of_birth: patientData.date_of_birth || '',
        gender: patientData.gender || '',
        country: patientData.country || '',
        address: patientData.address || '',
        medical_condition: patientData.medical_condition || '',
        allergies: patientData.allergies || '',
        notes: patientData.notes || '',
        photo_url: patientData.photo_url || '',
        has_companion: patientData.has_companion || false,
        companion_first_name: patientData.companion_first_name || '',
        companion_last_name: patientData.companion_last_name || '',
        companion_phone: patientData.companion_phone || '',
        companion_id_number: patientData.companion_id_number || '',
        organization_id: patientData.organization_id || '',
        estimated_price: patientData.estimated_price ? String(patientData.estimated_price) : '',
        final_price: patientData.final_price ? String(patientData.final_price) : ''
      });
      setPhotoPreview(patientData.photo_url || '');
      // Check if patient came from a lead
      setIsFromLead(!!patientData.lead_id);
    }
    setIsDialogOpen(true);
  };
  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientToDelete.id);

      if (error) {
        if (error.code === '42501') {
          toast({
            title: "Permission Error",
            description: "You don't have permission to delete this patient. Only the user who added the patient or administrators can delete.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Patient deleted successfully"
        });
        loadPatients();
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting patient",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleCrmStatusChange = async (patientId: string, newStatus: CrmStatus) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ crm_status: newStatus })
        .eq('id', patientId);

      if (error) throw error;

      // Update local state
      setPatients(prev => prev.map(p => 
        p.id === patientId ? { ...p, crm_status: newStatus } : p
      ));

      toast({
        title: "Success",
        description: "CRM status updated"
      });
    } catch (error) {
      console.error('Error updating CRM status:', error);
      toast({
        title: "Error",
        description: "Failed to update CRM status",
        variant: "destructive"
      });
    }
  };

  const clinicOptions = useMemo(() => {
    const uniqueClinics = new Map<string, string>();
    patients.forEach(p => {
      if (p.organization_id && p.organizations?.name) {
        uniqueClinics.set(p.organization_id, p.organizations.name);
      }
    });
    return Array.from(uniqueClinics.entries()).map(([value, label]) => ({ value, label }));
  }, [patients]);

  const countryOptions = useMemo(() => {
    const uniqueCountries = new Set<string>();
    patients.forEach(p => {
      if (p.country) uniqueCountries.add(p.country);
    });
    return Array.from(uniqueCountries).sort().map(c => ({ value: c, label: c }));
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const searchLower = searchQuery.toLowerCase().trim();
      
      // Search filter - check multiple fields
      let matchesSearch = true;
      if (searchLower) {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const email = patient.email?.toLowerCase() || '';
        const phone = patient.phone?.toLowerCase() || '';
        const clinicName = patient.organizations?.name?.toLowerCase() || '';
        const country = patient.country?.toLowerCase() || '';
        const treatmentNames = patient.patient_treatments?.map(pt => pt.treatments?.name?.toLowerCase() || '').join(' ') || '';
        
        matchesSearch = fullName.includes(searchLower) || 
                       email.includes(searchLower) ||
                       phone.includes(searchLower) ||
                       clinicName.includes(searchLower) || 
                       country.includes(searchLower) ||
                       treatmentNames.includes(searchLower);
      }

      // Clinic filter
      const matchesClinic = clinicFilter.length === 0 || clinicFilter.includes(patient.organization_id);

      // Country filter
      const matchesCountry = countryFilter.length === 0 || (patient.country && countryFilter.includes(patient.country));

      return matchesSearch && matchesClinic && matchesCountry;
    });
  }, [patients, searchQuery, clinicFilter, countryFilter]);

  useEffect(() => { setPage(1); }, [searchQuery, clinicFilter, countryFilter, sortKey, sortDirection]);

  const sortedPatients = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredPatients;
    const arr = [...filteredPatients];
    const getVal = (p: Patient): string | number => {
      switch (sortKey) {
        case 'patient': return `${p.first_name} ${p.last_name}`.toLowerCase();
        case 'crm_status': return (p.crm_status ? CRM_STATUS_CONFIG[p.crm_status]?.label : '').toLowerCase();
        case 'calls': return callCounts[p.id]?.count || 0;
        case 'clinic': return (p.organizations?.name || '').toLowerCase();
        case 'country': return (p.country || '').toLowerCase();
        case 'created_at': return new Date(p.created_at).getTime();
        default: return '';
      }
    };
    arr.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredPatients, sortKey, sortDirection, callCounts]);

  const pagedPatients = sortedPatients.slice((page - 1) * PATIENTS_PAGE_SIZE, page * PATIENTS_PAGE_SIZE);

  const handleExportExcel = () => {
    if (sortedPatients.length === 0) {
      toast({ title: 'No patients to export', variant: 'destructive' });
      return;
    }
    const rows = sortedPatients.map(p => ({
      'First Name': p.first_name,
      'Last Name': p.last_name,
      'Email': p.email || '',
      'Phone': p.phone,
      'Gender': p.gender || '',
      'Date of Birth': p.date_of_birth ? format(new Date(p.date_of_birth), 'dd/MM/yyyy') : '',
      'Country': p.country || '',
      'Medical Condition': p.medical_condition || '',
      'CRM Status': p.crm_status ? CRM_STATUS_CONFIG[p.crm_status]?.label : '',
      'Clinic': p.organizations?.name || '',
      'Treatments': (p.patient_treatments || []).map(pt => pt.treatments?.name).filter(Boolean).join(', '),
      'Calls': callCounts[p.id]?.count || 0,
      'Last Call': callCounts[p.id]?.lastCallAt ? format(new Date(callCounts[p.id]!.lastCallAt!), 'dd/MM/yyyy HH:mm') : '',
      'Created At': format(new Date(p.created_at), 'dd/MM/yyyy HH:mm'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');
    ws['!cols'] = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r] ?? '').length)) + 2,
    }));
    XLSX.writeFile(wb, `patients_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    toast({ title: 'Export complete', description: `${rows.length} patients exported` });
  };

  return <>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Patients</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Manage patient records and treatment history</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={photoPreview || formData.photo_url || ''} />
                      <AvatarFallback>
                        <User className="w-12 h-12" />
                      </AvatarFallback>
                    </Avatar>
                    {(photoPreview || formData.photo_url) && <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemovePhoto}>
                        <X className="h-3 w-3" />
                      </Button>}
                    <Label htmlFor="photo" className="absolute bottom-0 right-0 cursor-pointer bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                      <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </Label>
                  </div>
                </div>

                {/* Clinic selection for super admins - disabled if patient came from lead */}
                {isSuperAdmin && <div className="space-y-2">
                    <Label htmlFor="organization_id">Clinic *</Label>
                    {selectedPatient && isFromLead ? (
                      <div className="space-y-1">
                        <Select value={formData.organization_id} disabled>
                          <SelectTrigger className="opacity-60">
                            <SelectValue placeholder="Select clinic" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Clinic cannot be changed for patients from leads</p>
                      </div>
                    ) : (
                      <Select value={formData.organization_id} onValueChange={value => setFormData({
                        ...formData,
                        organization_id: value
                      })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select clinic" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input id="first_name" value={formData.first_name} onChange={e => setFormData({
                    ...formData,
                    first_name: e.target.value
                  })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input id="last_name" value={formData.last_name} onChange={e => setFormData({
                    ...formData,
                    last_name: e.target.value
                  })} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                    ...formData,
                    email: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({
                    ...formData,
                    phone: e.target.value
                  })} required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={e => setFormData({
                    ...formData,
                    date_of_birth: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={value => setFormData({
                      ...formData,
                      gender: value
                    })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={formData.country} onChange={e => setFormData({
                    ...formData,
                    country: e.target.value
                  })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData({
                  ...formData,
                  address: e.target.value
                })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_condition">Medical Condition</Label>
                  <Textarea id="medical_condition" value={formData.medical_condition} onChange={e => setFormData({
                  ...formData,
                  medical_condition: e.target.value
                })} rows={2} placeholder="Describe the patient's condition..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input id="allergies" value={formData.allergies} onChange={e => setFormData({
                  ...formData,
                  allergies: e.target.value
                })} placeholder="e.g., Penicillin, Latex" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
                  ...formData,
                  notes: e.target.value
                })} rows={2} />
                </div>

                {/* Pricing Section */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Pricing
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estimated_price">Estimated Price ($)</Label>
                      <Input
                        id="estimated_price"
                        type="number"
                        step="0.01"
                        value={formData.estimated_price}
                        onChange={e => setFormData({
                          ...formData,
                          estimated_price: e.target.value
                        })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="final_price">Final Price ($)</Label>
                      <Input
                        id="final_price"
                        type="number"
                        step="0.01"
                        value={formData.final_price}
                        onChange={e => setFormData({
                          ...formData,
                          final_price: e.target.value
                        })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Companion Section */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="has_companion" checked={formData.has_companion} onCheckedChange={checked => setFormData({
                    ...formData,
                    has_companion: checked as boolean
                  })} />
                    <Label htmlFor="has_companion" className="font-medium cursor-pointer">
                      Has Companion
                    </Label>
                  </div>

                  {formData.has_companion && <div className="pl-6 space-y-4 border-l-2 border-primary/20">
                      <h4 className="font-medium text-sm">Companion Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companion_first_name">First Name</Label>
                          <Input id="companion_first_name" value={formData.companion_first_name} onChange={e => setFormData({
                        ...formData,
                        companion_first_name: e.target.value
                      })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companion_last_name">Last Name</Label>
                          <Input id="companion_last_name" value={formData.companion_last_name} onChange={e => setFormData({
                        ...formData,
                        companion_last_name: e.target.value
                      })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companion_phone">Phone</Label>
                          <Input id="companion_phone" value={formData.companion_phone} onChange={e => setFormData({
                        ...formData,
                        companion_phone: e.target.value
                      })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companion_id_number">ID Number</Label>
                          <Input id="companion_id_number" value={formData.companion_id_number} onChange={e => setFormData({
                        ...formData,
                        companion_id_number: e.target.value
                      })} />
                        </div>
                      </div>
                    </div>}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedPatient ? 'Update' : 'Create'} Patient
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by name, email, phone, clinic, country or treatment..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10" 
            />
          </div>
          {(clinicFilter.length > 0 || countryFilter.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClinicFilter([]);
                setCountryFilter([]);
              }}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading patients...
              </div>
            ) : sortedPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No patients found
              </div>
            ) : (
              pagedPatients.map(patient => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={() => handleEdit(patient)}
                  onDetails={() => {
                    setSelectedPatient(patient);
                    setShowPatientDetails(true);
                  }}
                  onDelete={() => handleDeleteClick(patient)}
                  onCrmStatusChange={handleCrmStatusChange}
                />
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="bg-card rounded-lg border overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader title="Patient" sortKey="patient" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHeader title="CRM Status" sortKey="crm_status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="text-center w-20">
                    <SortableHeader title="Calls" sortKey="calls" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <SortableHeader title="Country" sortKey="country" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                      <ColumnFilter title="" options={countryOptions} selectedValues={countryFilter} onFilterChange={setCountryFilter} />
                    </div>
                  </TableHead>
                  {isSuperAdmin && (
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <SortableHeader title="Clinic" sortKey="clinic" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort} />
                        <ColumnFilter title="" options={clinicOptions} selectedValues={clinicFilter} onFilterChange={setClinicFilter} />
                      </div>
                    </TableHead>
                  )}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8">
                      Loading patients...
                    </TableCell>
                  </TableRow> : sortedPatients.length === 0 ? <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No patients found
                    </TableCell>
                  </TableRow> : pagedPatients.map(patient => <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => { setSelectedPatient(patient); setShowPatientDetails(true); }}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={patient.photo_url || ''} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="w-4 h-4 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                            {patient.gender && <div className="text-xs text-muted-foreground">{patient.gender}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={patient.crm_status || 'new_lead'}
                          onValueChange={(value) => handleCrmStatusChange(patient.id, value as CrmStatus)}
                        >
                          <SelectTrigger className={`w-44 h-8 text-xs ${CRM_STATUS_CONFIG[patient.crm_status || 'new_lead'].bgColor} ${CRM_STATUS_CONFIG[patient.crm_status || 'new_lead'].color} border-0`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CRM_STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <span className={`${config.color}`}>{config.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const info = callCounts[patient.id];
                          const count = info?.count || 0;
                          if (count === 0) {
                            return <span className="text-xs text-muted-foreground">—</span>;
                          }
                          return (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                                  <PhoneCall className="w-3 h-3" />
                                  <span className="text-xs font-medium">{count}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="center">
                                <div className="space-y-1 text-sm">
                                  <div className="font-medium">Last Call</div>
                                  <div className="text-muted-foreground">
                                    {info?.lastCallAt ? format(new Date(info.lastCallAt), 'dd MMM yyyy HH:mm') : '—'}
                                  </div>
                                  {info?.lastResult && (
                                    <div className="text-xs text-muted-foreground">
                                      Result: {info.lastResult}
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })()}
                      </TableCell>
                      <TableCell onClick={() => { setSelectedPatient(patient); setShowPatientDetails(true); }}>
                        <span className="text-sm">{patient.country || '-'}</span>
                      </TableCell>
                      {isSuperAdmin && <TableCell onClick={() => { setSelectedPatient(patient); setShowPatientDetails(true); }}>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Building2 className="w-3 h-3" />
                            {patient.organizations?.name || '-'}
                          </Badge>
                        </TableCell>}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(patient);
                          }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                            setShowPatientDetails(true);
                          }} title="Details">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(patient);
                          }} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
              </TableBody>
            </Table>
          </div>
        )}

        <SimplePagination
          currentPage={page}
          totalItems={sortedPatients.length}
          pageSize={PATIENTS_PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg md:text-xl">
              Patient Details
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedPatient?.first_name} {selectedPatient?.last_name}
            </p>
          </DialogHeader>
          {selectedPatient && <PatientDetails patientId={selectedPatient.id} onClose={() => setShowPatientDetails(false)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{patientToDelete?.first_name} {patientToDelete?.last_name}</strong>? 
              This action cannot be undone and all patient data will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}