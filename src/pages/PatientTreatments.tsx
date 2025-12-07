import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Stethoscope, FileText, Upload, Trash2, Eye, Calendar, Building2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED'];

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization?: {
    name: string;
  };
}

interface Treatment {
  id: string;
  name: string;
  base_price: number;
  currency: string;
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
  treatment?: Treatment;
}

export default function PatientTreatments() {
  const { profile, isSuperAdmin } = useAuth();
  const [patientTreatments, setPatientTreatments] = useState<PatientTreatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PatientTreatment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
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
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPatientTreatments(), loadPatients(), loadTreatments()]);
    setLoading(false);
  };

  const loadPatientTreatments = async () => {
    if (!profile) return;

    try {
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

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('patient.organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter out items where patient is null (due to RLS)
      const filtered = (data || []).filter(item => item.patient !== null);
      setPatientTreatments(filtered as PatientTreatment[]);
    } catch (error) {
      console.error('Error loading patient treatments:', error);
      toast({
        title: "Error",
        description: "Failed to load patient treatments",
        variant: "destructive",
      });
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

  const loadTreatments = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('treatments')
        .select('id, name, base_price, currency')
        .eq('is_active', true)
        .order('name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error loading treatments:', error);
    }
  };

  const calculateFinalPrice = () => {
    const price = parseFloat(formData.price) || 0;
    const discountValue = parseFloat(formData.discount_value) || 0;

    if (formData.discount_type === 'percentage') {
      return price - (price * discountValue / 100);
    } else if (formData.discount_type === 'fixed_amount') {
      return price - discountValue;
    }
    return price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const finalPrice = calculateFinalPrice();

      const treatmentData = {
        patient_id: formData.patient_id,
        treatment_id: formData.treatment_id,
        price: parseFloat(formData.price),
        final_price: finalPrice,
        currency: formData.currency,
        discount_type: formData.discount_type || null,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        notes: formData.notes || null,
        treatment_date: formData.treatment_date || null,
      };

      if (selectedItem) {
        const { error } = await supabase
          .from('patient_treatments')
          .update(treatmentData)
          .eq('id', selectedItem.id);

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

      setIsDialogOpen(false);
      resetForm();
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
      patient_id: '',
      treatment_id: '',
      price: '',
      currency: 'USD',
      discount_type: '',
      discount_value: '',
      notes: '',
      treatment_date: '',
    });
    setSelectedItem(null);
  };

  const handleEdit = (item: PatientTreatment) => {
    setSelectedItem(item);
    setFormData({
      patient_id: item.patient_id,
      treatment_id: item.treatment_id,
      price: item.price.toString(),
      currency: item.currency,
      discount_type: item.discount_type || '',
      discount_value: item.discount_value?.toString() || '',
      notes: item.notes || '',
      treatment_date: item.treatment_date || '',
    });
    setIsDialogOpen(true);
  };

  const handleTreatmentSelect = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (treatment) {
      setFormData({
        ...formData,
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
        .createSignedUrl(pdfPath, 3600); // 1 hour expiry

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
      
      // Delete PDF if exists
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

  const filteredItems = patientTreatments.filter(item => {
    const patientName = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    const treatmentName = item.treatment?.name?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    return patientName.includes(searchLower) || treatmentName.includes(searchLower);
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Patient Treatments</h1>
            <p className="text-muted-foreground mt-2">Manage patient treatment plans and records</p>
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
                <DialogTitle>{selectedItem ? 'Edit Patient Treatment' : 'Add Patient Treatment'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_id">Patient *</Label>
                    <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
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
                    <Select value={formData.treatment_id} onValueChange={handleTreatmentSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map(treatment => (
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
                    value={formData.treatment_date}
                    onChange={(e) => setFormData({ ...formData, treatment_date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_type">Discount Type</Label>
                    <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed_amount' | '') => setFormData({ ...formData, discount_type: value })}>
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
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      disabled={!formData.discount_type}
                    />
                  </div>
                </div>

                {formData.price && (
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Final Price: </span>
                    <span className="font-bold">{formData.currency} {calculateFinalPrice().toFixed(2)}</span>
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
                    {selectedItem ? 'Update' : 'Create'} Treatment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by patient name or treatment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading patient treatments...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No patient treatments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
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
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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
          </CardContent>
        </Card>

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
    </Layout>
  );
}
