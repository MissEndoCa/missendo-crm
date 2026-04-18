import { useEffect, useState } from 'react';
import { SimplePagination } from '@/components/SimplePagination';

const PAGE_SIZE = 15;
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Stethoscope, FileText, Upload, Eye, Calendar, Building2, User, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED'];

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  currency: string;
  duration_minutes: number | null;
  is_active: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization?: {
    name: string;
  };
}

interface PatientTreatment {
  id: string;
  patient_id: string;
  treatment_id: string;
  price: number;
  final_price: number;
  currency: string;
  discount_type: 'percentage' | 'fixed_amount' | null;
  discount_value: number | null;
  notes: string | null;
  performed_at: string | null;
  treatment_date: string | null;
  treatment_plan_pdf: string | null;
  created_at: string;
  patient?: Patient;
  treatment?: {
    id: string;
    name: string;
    base_price: number;
    currency: string;
  };
}

export default function Treatments() {
  const { profile, isSuperAdmin } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patientTreatments, setPatientTreatments] = useState<PatientTreatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientTreatmentsLoading, setPatientTreatmentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPatientTreatmentDialogOpen, setIsPatientTreatmentDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [selectedPatientTreatment, setSelectedPatientTreatment] = useState<PatientTreatment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [treatmentsPage, setTreatmentsPage] = useState(1);
  const [patientTreatmentsPage, setPatientTreatmentsPage] = useState(1);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    currency: 'USD',
    duration_minutes: '',
    is_active: true,
  });

  const [patientTreatmentForm, setPatientTreatmentForm] = useState({
    patient_id: '',
    treatment_id: '',
    price: '',
    currency: 'USD',
    discount_type: '' as 'percentage' | 'fixed_amount' | '',
    discount_value: '',
    notes: '',
    treatment_date: '',
  });

  useEffect(() => {
    if (profile) {
      loadTreatments();
      loadPatientTreatments();
      loadPatients();
    }
  }, [profile]);

  const loadTreatments = async () => {
    if (!profile) return;

    try {
      let query = supabase.from('treatments').select('*').order('name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error loading treatments:', error);
      toast({
        title: "Error",
        description: "Failed to load treatments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientTreatments = async () => {
    if (!profile) return;

    try {
      setPatientTreatmentsLoading(true);
      let query = supabase
        .from('patient_treatments')
        .select(`
          *,
          patient:patients (
            id,
            first_name,
            last_name,
            organization_id,
            organization:organizations (name)
          ),
          treatment:treatments (
            id,
            name,
            base_price,
            currency
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      const filtered = (data || []).filter(item => item.patient !== null);
      setPatientTreatments(filtered as PatientTreatment[]);
    } catch (error) {
      console.error('Error loading patient treatments:', error);
    } finally {
      setPatientTreatmentsLoading(false);
    }
  };

  const loadPatients = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, organization_id')
        .order('first_name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive",
      });
      return;
    }

    try {
      const treatmentData = {
        name: formData.name,
        description: formData.description || null,
        base_price: parseFloat(formData.base_price),
        currency: formData.currency,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: formData.is_active,
        organization_id: profile.organization_id,
      };

      if (selectedTreatment) {
        const { error } = await supabase
          .from('treatments')
          .update(treatmentData)
          .eq('id', selectedTreatment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Treatment updated successfully",
        });
      } else {
        const { error } = await supabase.from('treatments').insert([treatmentData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Treatment created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadTreatments();
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast({
        title: "Error",
        description: "Failed to save treatment",
        variant: "destructive",
      });
    }
  };

  const calculateFinalPrice = () => {
    const price = parseFloat(patientTreatmentForm.price) || 0;
    const discountValue = parseFloat(patientTreatmentForm.discount_value) || 0;

    if (patientTreatmentForm.discount_type === 'percentage') {
      return price - (price * discountValue / 100);
    } else if (patientTreatmentForm.discount_type === 'fixed_amount') {
      return price - discountValue;
    }
    return price;
  };

  const handlePatientTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const finalPrice = calculateFinalPrice();

      const treatmentData = {
        patient_id: patientTreatmentForm.patient_id,
        treatment_id: patientTreatmentForm.treatment_id,
        price: parseFloat(patientTreatmentForm.price),
        final_price: finalPrice,
        currency: patientTreatmentForm.currency,
        discount_type: patientTreatmentForm.discount_type || null,
        discount_value: patientTreatmentForm.discount_value ? parseFloat(patientTreatmentForm.discount_value) : null,
        notes: patientTreatmentForm.notes || null,
        treatment_date: patientTreatmentForm.treatment_date || null,
      };

      if (selectedPatientTreatment) {
        const { error } = await supabase
          .from('patient_treatments')
          .update(treatmentData)
          .eq('id', selectedPatientTreatment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Patient treatment updated successfully",
        });
      } else {
        const { error } = await supabase.from('patient_treatments').insert([treatmentData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Patient treatment created successfully",
        });
      }

      setIsPatientTreatmentDialogOpen(false);
      resetPatientTreatmentForm();
      loadPatientTreatments();
    } catch (error) {
      console.error('Error saving patient treatment:', error);
      toast({
        title: "Error",
        description: "Failed to save patient treatment",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      currency: 'USD',
      duration_minutes: '',
      is_active: true,
    });
    setSelectedTreatment(null);
  };

  const resetPatientTreatmentForm = () => {
    setPatientTreatmentForm({
      patient_id: '',
      treatment_id: '',
      price: '',
      currency: 'USD',
      discount_type: '',
      discount_value: '',
      notes: '',
      treatment_date: '',
    });
    setSelectedPatientTreatment(null);
  };

  const handleEdit = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setFormData({
      name: treatment.name,
      description: treatment.description || '',
      base_price: treatment.base_price.toString(),
      currency: treatment.currency,
      duration_minutes: treatment.duration_minutes?.toString() || '',
      is_active: treatment.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleEditPatientTreatment = (item: PatientTreatment) => {
    setSelectedPatientTreatment(item);
    setPatientTreatmentForm({
      patient_id: item.patient_id,
      treatment_id: item.treatment_id,
      price: item.price.toString(),
      currency: item.currency,
      discount_type: item.discount_type || '',
      discount_value: item.discount_value?.toString() || '',
      notes: item.notes || '',
      treatment_date: item.treatment_date || '',
    });
    setIsPatientTreatmentDialogOpen(true);
  };

  const handleTreatmentSelect = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (treatment) {
      setPatientTreatmentForm({
        ...patientTreatmentForm,
        treatment_id: treatmentId,
        price: treatment.base_price.toString(),
        currency: treatment.currency,
      });
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, patientTreatmentId: string, patientId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploadingPdf(true);
    try {
      const fileName = `${patientId}/${patientTreatmentId}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('treatment-plans')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('patient_treatments')
        .update({ treatment_plan_pdf: fileName })
        .eq('id', patientTreatmentId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Treatment plan PDF uploaded successfully",
      });

      loadPatientTreatments();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleViewPdf = async (pdfPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('treatment-plans')
        .createSignedUrl(pdfPath, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error getting PDF URL:', error);
      toast({
        title: "Error",
        description: "Failed to open PDF",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItemId) return;

    try {
      const item = patientTreatments.find(pt => pt.id === deletingItemId);
      
      if (item?.treatment_plan_pdf) {
        await supabase.storage
          .from('treatment-plans')
          .remove([item.treatment_plan_pdf]);
      }

      const { error } = await supabase
        .from('patient_treatments')
        .delete()
        .eq('id', deletingItemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient treatment deleted successfully",
      });

      setDeleteDialogOpen(false);
      setDeletingItemId(null);
      loadPatientTreatments();
    } catch (error) {
      console.error('Error deleting patient treatment:', error);
      toast({
        title: "Error",
        description: "Failed to delete patient treatment",
        variant: "destructive",
      });
    }
  };

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatientTreatments = patientTreatments.filter(item => {
    const patientName = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    const treatmentName = item.treatment?.name?.toLowerCase() || '';
    const searchLower = patientSearchQuery.toLowerCase();
    return patientName.includes(searchLower) || treatmentName.includes(searchLower);
  });

  useEffect(() => { setTreatmentsPage(1); }, [searchQuery]);
  useEffect(() => { setPatientTreatmentsPage(1); }, [patientSearchQuery]);
  const pagedTreatments = filteredTreatments.slice((treatmentsPage - 1) * PAGE_SIZE, treatmentsPage * PAGE_SIZE);
  const pagedPatientTreatments = filteredPatientTreatments.slice((patientTreatmentsPage - 1) * PAGE_SIZE, patientTreatmentsPage * PAGE_SIZE);

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Treatments</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Manage dental treatments and patient treatment plans</p>
          </div>
        </div>

        <Tabs defaultValue="treatments" className="space-y-4 md:space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="treatments">Treatment List</TabsTrigger>
            <TabsTrigger value="patient-treatments">Patient Treatments</TabsTrigger>
          </TabsList>

          {/* Treatments Tab */}
          <TabsContent value="treatments" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search treatments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Treatment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedTreatment ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Treatment Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Dental Implant, Root Canal"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="base_price">Base Price *</Label>
                        <Input
                          id="base_price"
                          type="number"
                          step="0.01"
                          value={formData.base_price}
                          onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(curr => (
                              <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        placeholder="e.g., 60"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {selectedTreatment ? 'Update' : 'Create'} Treatment
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading treatments...
                      </TableCell>
                    </TableRow>
                  ) : filteredTreatments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No treatments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedTreatments.map((treatment) => (
                      <TableRow key={treatment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(treatment)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-primary" />
                            <div>
                              <div className="font-medium">{treatment.name}</div>
                              {treatment.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {treatment.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {treatment.currency} {treatment.base_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {treatment.duration_minutes ? `${treatment.duration_minutes} min` : '-'}
                        </TableCell>
                        <TableCell>
                          {treatment.is_active ? (
                            <Badge className="bg-success/10 text-success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
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
            <SimplePagination
              currentPage={treatmentsPage}
              totalItems={filteredTreatments.length}
              pageSize={PAGE_SIZE}
              onPageChange={setTreatmentsPage}
            />
          </TabsContent>

          {/* Patient Treatments Tab */}
          <TabsContent value="patient-treatments" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by patient name or treatment..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isPatientTreatmentDialogOpen} onOpenChange={setIsPatientTreatmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetPatientTreatmentForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Patient Treatment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedPatientTreatment ? 'Edit Patient Treatment' : 'Add Patient Treatment'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePatientTreatmentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patient_id">Patient *</Label>
                        <Select value={patientTreatmentForm.patient_id} onValueChange={(value) => setPatientTreatmentForm({ ...patientTreatmentForm, patient_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map(patient => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.first_name} {patient.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="treatment_id">Treatment *</Label>
                        <Select value={patientTreatmentForm.treatment_id} onValueChange={handleTreatmentSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select treatment" />
                          </SelectTrigger>
                          <SelectContent>
                            {treatments.filter(t => t.is_active).map(treatment => (
                              <SelectItem key={treatment.id} value={treatment.id}>
                                {treatment.name} ({treatment.currency} {treatment.base_price})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="treatment_date">Treatment Date</Label>
                      <Input
                        id="treatment_date"
                        type="date"
                        value={patientTreatmentForm.treatment_date}
                        onChange={(e) => setPatientTreatmentForm({ ...patientTreatmentForm, treatment_date: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={patientTreatmentForm.price}
                          onChange={(e) => setPatientTreatmentForm({ ...patientTreatmentForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pt_currency">Currency</Label>
                        <Select value={patientTreatmentForm.currency} onValueChange={(value) => setPatientTreatmentForm({ ...patientTreatmentForm, currency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(curr => (
                              <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discount_type">Discount Type</Label>
                        <Select value={patientTreatmentForm.discount_type} onValueChange={(value: 'percentage' | 'fixed_amount' | '') => setPatientTreatmentForm({ ...patientTreatmentForm, discount_type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="No discount" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount_value">Discount Value</Label>
                        <Input
                          id="discount_value"
                          type="number"
                          step="0.01"
                          value={patientTreatmentForm.discount_value}
                          onChange={(e) => setPatientTreatmentForm({ ...patientTreatmentForm, discount_value: e.target.value })}
                          disabled={!patientTreatmentForm.discount_type}
                        />
                      </div>
                    </div>

                    {patientTreatmentForm.price && (
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Final Price: </span>
                        <span className="font-bold">{patientTreatmentForm.currency} {calculateFinalPrice().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={patientTreatmentForm.notes}
                        onChange={(e) => setPatientTreatmentForm({ ...patientTreatmentForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsPatientTreatmentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {selectedPatientTreatment ? 'Update' : 'Create'} Treatment
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Patient Treatment Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Clinic</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Treatment Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Final Price</TableHead>
                      <TableHead>Treatment Plan</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientTreatmentsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading patient treatments...
                        </TableCell>
                      </TableRow>
                    ) : filteredPatientTreatments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No patient treatments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedPatientTreatments.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {item.patient?.first_name} {item.patient?.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {item.patient?.organization?.name || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-primary" />
                              <span>{item.treatment?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {item.treatment_date 
                                  ? new Date(item.treatment_date).toLocaleDateString()
                                  : '-'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.currency} {Number(item.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-bold">
                            {item.currency} {Number(item.final_price).toFixed(2)}
                            {item.discount_value && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                -{item.discount_type === 'percentage' ? `${item.discount_value}%` : item.discount_value}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.treatment_plan_pdf ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPdf(item.treatment_plan_pdf!)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View PDF
                              </Button>
                            ) : (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => handlePdfUpload(e, item.id, item.patient_id)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  disabled={uploadingPdf}
                                />
                                <Button variant="outline" size="sm" disabled={uploadingPdf}>
                                  <Upload className="w-4 h-4 mr-1" />
                                  {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditPatientTreatment(item)}>
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <SimplePagination
                  currentPage={patientTreatmentsPage}
                  totalItems={filteredPatientTreatments.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPatientTreatmentsPage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this patient treatment record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
