import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Phone, Mail, Upload, X, Building2, Pencil, Trash2, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PatientDetails } from '@/components/PatientDetails';
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
    isSuperAdmin
  } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    organization_id: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    loadPatients();
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [profile, isSuperAdmin]);
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
    if (!profile) return;
    try {
      let query = supabase.from('patients').select('*, organizations(name), patient_treatments(treatments(name))').order('created_at', {
        ascending: false
      });
      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
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
        const patientId = selectedPatient?.id || crypto.randomUUID();
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${patientId}/${Date.now()}.${fileExt}`;
        const {
          error: uploadError
        } = await supabase.storage.from('patient-photos').upload(fileName, photoFile, {
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
      const patientData = {
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
        companion_id_number: formData.has_companion ? formData.companion_id_number : null
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
      organization_id: profile?.organization_id || ''
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setSelectedPatient(null);
  };
  const handleEdit = async (patient: Patient) => {
    setSelectedPatient(patient);

    // Fetch full patient details
    const {
      data
    } = await supabase.from('patients').select('*').eq('id', patient.id).single();
    if (data) {
      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone,
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        country: data.country || '',
        address: data.address || '',
        medical_condition: data.medical_condition || '',
        allergies: data.allergies || '',
        notes: data.notes || '',
        photo_url: data.photo_url || '',
        has_companion: data.has_companion || false,
        companion_first_name: data.companion_first_name || '',
        companion_last_name: data.companion_last_name || '',
        companion_phone: data.companion_phone || '',
        companion_id_number: data.companion_id_number || '',
        organization_id: data.organization_id || ''
      });
      setPhotoPreview(data.photo_url || '');
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
            title: "Yetki Hatası",
            description: "Bu hastayı silme yetkiniz yok. Yalnızca hastayı ekleyen kullanıcı veya yöneticiler silebilir.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Başarılı",
          description: "Hasta başarıyla silindi"
        });
        loadPatients();
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Hata",
        description: "Hasta silinirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const clinicName = patient.organizations?.name?.toLowerCase() || '';
    const treatmentNames = patient.patient_treatments?.map(pt => pt.treatments?.name?.toLowerCase() || '').join(' ') || '';
    
    return fullName.includes(searchLower) || 
           clinicName.includes(searchLower) || 
           treatmentNames.includes(searchLower);
  });
  return <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground mt-2">Manage patient records and treatment history</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
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

                {/* Clinic selection for super admins */}
                {isSuperAdmin && <div className="space-y-2">
                    <Label htmlFor="organization_id">Clinic *</Label>
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
                    <Input id="gender" value={formData.gender} onChange={e => setFormData({
                    ...formData,
                    gender: e.target.value
                  })} placeholder="Male/Female/Other" />
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

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="has_companion" checked={formData.has_companion} onCheckedChange={checked => setFormData({
                    ...formData,
                    has_companion: checked as boolean
                  })} />
                    <Label htmlFor="has_companion" className="font-medium cursor-pointer">
                      Patient has a companion
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search patients by name, clinic, or service..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                {isSuperAdmin && <TableHead>Clinic</TableHead>}
                <TableHead>Birth Date</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8">
                    Loading patients...
                  </TableCell>
                </TableRow> : filteredPatients.length === 0 ? <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No patients found
                  </TableCell>
                </TableRow> : filteredPatients.map(patient => <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => handleEdit(patient)}>
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
                    <TableCell onClick={() => handleEdit(patient)}>
                      <div className="space-y-1">
                        {patient.email && <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{patient.email}</span>
                          </div>}
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{patient.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    {isSuperAdmin && <TableCell onClick={() => handleEdit(patient)}>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Building2 className="w-3 h-3" />
                          {patient.organizations?.name || '-'}
                        </Badge>
                      </TableCell>}
                    <TableCell onClick={() => handleEdit(patient)} className="text-sm text-muted-foreground">
                      {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell onClick={() => handleEdit(patient)} className="text-sm">
                      {patient.country || '-'}
                    </TableCell>
                    <TableCell onClick={() => handleEdit(patient)} className="text-sm text-muted-foreground">
                      {format(new Date(patient.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(patient);
                        }} title="Düzenle">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                          setShowPatientDetails(true);
                        }} title="Detaylar">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(patient);
                        }} title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDetails} onOpenChange={setShowPatientDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Patient Details - {selectedPatient?.first_name} {selectedPatient?.last_name}
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && <PatientDetails patientId={selectedPatient.id} onClose={() => setShowPatientDetails(false)} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hastayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{patientToDelete?.first_name} {patientToDelete?.last_name}</strong> adlı hastayı silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz ve hastaya ait tüm veriler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>;
}