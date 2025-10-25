import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Hotel, Car, FileText, Plus, Upload, Download, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PatientDetailsProps {
  patientId: string;
  onClose: () => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  notes: string;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  created_at: string;
  notes: string | null;
}

export function PatientDetails({ patientId, onClose }: PatientDetailsProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: '',
    treatment_id: '',
    hotel_id: '',
    transfer_id: '',
    notes: ''
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentNotes, setDocumentNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, documentsRes, hotelsRes, transfersRes, treatmentsRes] = await Promise.all([
        supabase.from('appointments').select('*').eq('patient_id', patientId),
        supabase.from('patient_documents').select('*').eq('patient_id', patientId),
        supabase.from('hotels').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('transfer_services').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('treatments').select('*').eq('organization_id', profile?.organization_id)
      ]);

      setAppointments(appointmentsRes.data || []);
      setDocuments(documentsRes.data || []);
      setHotels(hotelsRes.data || []);
      setTransfers(transfersRes.data || []);
      setTreatments(treatmentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('appointments').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        appointment_date: appointmentForm.appointment_date,
        treatment_id: appointmentForm.treatment_id || null,
        hotel_id: appointmentForm.hotel_id || null,
        transfer_id: appointmentForm.transfer_id || null,
        notes: appointmentForm.notes || null,
        status: 'scheduled',
        created_by: profile?.id
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment created successfully'
      });

      setAppointmentForm({
        appointment_date: '',
        treatment_id: '',
        hotel_id: '',
        transfer_id: '',
        notes: ''
      });

      loadData();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add appointment',
        variant: 'destructive'
      });
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentFile) return;

    try {
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, documentFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('patient_documents').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        document_name: documentFile.name,
        document_type: documentFile.type,
        file_path: fileName,
        file_size: documentFile.size,
        uploaded_by: profile?.id,
        notes: documentNotes || null
      }]);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      });

      setDocumentFile(null);
      setDocumentNotes('');
      loadData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document deleted successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment deleted successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete appointment',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Add Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date">Date & Time *</Label>
                    <Input
                      id="appointment_date"
                      type="datetime-local"
                      value={appointmentForm.appointment_date}
                      onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatment_id">Treatment</Label>
                    <Select value={appointmentForm.treatment_id} onValueChange={(value) => setAppointmentForm({...appointmentForm, treatment_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotel_id">Hotel</Label>
                    <Select value={appointmentForm.hotel_id} onValueChange={(value) => setAppointmentForm({...appointmentForm, hotel_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map(h => (
                          <SelectItem key={h.id} value={h.id}>{h.hotel_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer_id">Transfer</Label>
                    <Select value={appointmentForm.transfer_id} onValueChange={(value) => setAppointmentForm({...appointmentForm, transfer_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transfer" />
                      </SelectTrigger>
                      <SelectContent>
                        {transfers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                    rows={3}
                  />
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Appointment
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointments History</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No appointments yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map(apt => (
                      <TableRow key={apt.id}>
                        <TableCell>{format(new Date(apt.appointment_date), 'PPP p')}</TableCell>
                        <TableCell className="capitalize">{apt.status}</TableCell>
                        <TableCell>{apt.notes || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAppointment(apt.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document">File (PDF, PNG, JPEG) *</Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-notes">Notes</Label>
                  <Textarea
                    id="doc-notes"
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button type="submit" disabled={!documentFile}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                        <TableCell>{doc.notes || '-'}</TableCell>
                        <TableCell>{format(new Date(doc.created_at), 'PPP')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadDocument(doc.file_path, doc.document_name)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Services are assigned through appointments</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
