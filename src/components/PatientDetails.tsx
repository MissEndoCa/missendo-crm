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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Plus, Upload, Download, Trash2, Eye, MessageSquare, CreditCard, Plane, DollarSign, User, Phone, Mail, MapPin, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PatientDetailsProps {
  patientId: string;
  onClose: () => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  notes: string;
  treatments: { name: string } | null;
  hotels: { hotel_name: string } | null;
  transfer_services: { company_name: string } | null;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  created_at: string;
  notes: string | null;
}

interface PatientNote {
  id: string;
  note_date: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface PatientPayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  currency: string;
  notes: string | null;
  created_at: string;
}

interface PatientTransfer {
  id: string;
  clinic_name: string | null;
  flight_info: string | null;
  airport_pickup_info: string | null;
  transfer_datetime: string;
  notes: string | null;
  created_at: string;
}

export function PatientDetails({ patientId, onClose }: PatientDetailsProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [payments, setPayments] = useState<PatientPayment[]>([]);
  const [patientTransfers, setPatientTransfers] = useState<PatientTransfer[]>([]);
  const [patientInfo, setPatientInfo] = useState<{ 
    total_cost: number; 
    total_paid: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    country?: string;
    address?: string;
    medical_condition?: string;
    allergies?: string;
    notes?: string;
    photo_url?: string;
    has_companion?: boolean;
    companion_first_name?: string;
    companion_last_name?: string;
    companion_phone?: string;
  } | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string; type: string } | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: '',
    treatment_id: '',
    hotel_id: '',
    transfer_id: '',
    notes: ''
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentNotes, setDocumentNotes] = useState('');

  const [noteForm, setNoteForm] = useState({
    note_date: new Date().toISOString().split('T')[0],
    content: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    clinic_name: '',
    flight_info: '',
    airport_pickup_info: '',
    transfer_datetime: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, documentsRes, notesRes, paymentsRes, patientTransfersRes, patientRes, hotelsRes, transfersRes, treatmentsRes, patientTreatmentsRes] = await Promise.all([
        supabase.from('appointments').select('*, treatments(name), hotels(hotel_name), transfer_services(company_name)').eq('patient_id', patientId),
        supabase.from('patient_documents').select('*').eq('patient_id', patientId),
        supabase.from('patient_notes').select('*').eq('patient_id', patientId).order('note_date', { ascending: false }),
        supabase.from('patient_payments').select('*').eq('patient_id', patientId).order('payment_date', { ascending: false }),
        supabase.from('patient_transfers').select('*').eq('patient_id', patientId).order('transfer_datetime', { ascending: false }),
        supabase.from('patients').select('total_cost, total_paid, first_name, last_name, email, phone, date_of_birth, gender, country, address, medical_condition, allergies, notes, photo_url, has_companion, companion_first_name, companion_last_name, companion_phone').eq('id', patientId).maybeSingle(),
        supabase.from('hotels').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('transfer_services').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('treatments').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('patient_treatments').select('final_price').eq('patient_id', patientId)
      ]);

      // Calculate total cost from patient treatments
      const treatmentTotal = (patientTreatmentsRes.data || []).reduce((sum, t) => sum + (Number(t.final_price) || 0), 0);
      
      setAppointments(appointmentsRes.data || []);
      setDocuments(documentsRes.data || []);
      setNotes(notesRes.data || []);
      setPayments(paymentsRes.data || []);
      setPatientTransfers(patientTransfersRes.data || []);
      // Use calculated treatment total if total_cost is 0 or null
      const patientData = patientRes.data;
      if (patientData) {
        const dbTotalCost = patientData.total_cost || 0;
        patientData.total_cost = dbTotalCost > 0 ? dbTotalCost : treatmentTotal;
      }
      setPatientInfo(patientData);
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

  const handleViewDocument = async (filePath: string, fileName: string, fileType: string) => {
    try {
      // Download file as blob to avoid Chrome blocking cross-origin URLs
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .download(filePath);

      if (error) throw error;

      // Create blob URL for viewing
      const blobUrl = URL.createObjectURL(data);
      
      setViewingDocument({
        url: blobUrl,
        name: fileName,
        type: fileType
      });
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: 'Hata',
        description: 'Belge görüntülenemedi',
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

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.content.trim()) return;

    try {
      const { error } = await supabase.from('patient_notes').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        note_date: noteForm.note_date,
        content: noteForm.content,
        created_by: profile?.id
      }]);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Not eklendi'
      });

      setNoteForm({
        note_date: new Date().toISOString().split('T')[0],
        content: ''
      });

      loadData();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Hata',
        description: 'Not eklenemedi',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Not silindi'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Hata',
        description: 'Not silinemedi',
        variant: 'destructive'
      });
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) return;

    try {
      const paymentAmount = parseFloat(paymentForm.amount);
      
      const { error } = await supabase.from('patient_payments').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        amount: paymentAmount,
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method || null,
        notes: paymentForm.notes || null,
        created_by: profile?.id
      }]);

      if (error) throw error;

      // Update total_paid in patients table
      const newTotalPaid = (patientInfo?.total_paid || 0) + paymentAmount;
      await supabase.from('patients').update({ total_paid: newTotalPaid }).eq('id', patientId);

      toast({
        title: 'Başarılı',
        description: 'Ödeme kaydedildi'
      });

      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        notes: ''
      });

      loadData();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Hata',
        description: 'Ödeme kaydedilemedi',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePayment = async (paymentId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('patient_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      // Update total_paid in patients table
      const newTotalPaid = Math.max(0, (patientInfo?.total_paid || 0) - amount);
      await supabase.from('patients').update({ total_paid: newTotalPaid }).eq('id', patientId);

      toast({
        title: 'Başarılı',
        description: 'Ödeme silindi'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Hata',
        description: 'Ödeme silinemedi',
        variant: 'destructive'
      });
    }
  };

  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.transfer_datetime) return;

    try {
      const { error } = await supabase.from('patient_transfers').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        clinic_name: transferForm.clinic_name || null,
        flight_info: transferForm.flight_info || null,
        airport_pickup_info: transferForm.airport_pickup_info || null,
        transfer_datetime: transferForm.transfer_datetime,
        notes: transferForm.notes || null,
        created_by: profile?.id
      }]);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Transfer bilgisi eklendi'
      });

      setTransferForm({
        clinic_name: '',
        flight_info: '',
        airport_pickup_info: '',
        transfer_datetime: '',
        notes: ''
      });

      loadData();
    } catch (error) {
      console.error('Error adding transfer:', error);
      toast({
        title: 'Hata',
        description: 'Transfer bilgisi eklenemedi',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTransfer = async (transferId: string) => {
    try {
      const { error } = await supabase
        .from('patient_transfers')
        .delete()
        .eq('id', transferId);

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Transfer bilgisi silindi'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting transfer:', error);
      toast({
        title: 'Hata',
        description: 'Transfer bilgisi silinemedi',
        variant: 'destructive'
      });
    }
  };

  const totalCost = patientInfo?.total_cost || 0;
  const totalPaid = patientInfo?.total_paid || 0;
  const remainingDebt = totalCost - totalPaid;

  return (
    <div className="space-y-6">
      {/* Patient Profile Summary Card */}
      {patientInfo && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left: Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={patientInfo.photo_url || ''} alt={`${patientInfo.first_name} ${patientInfo.last_name}`} />
                    <AvatarFallback className="bg-primary/10">
                      <User className="w-6 h-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{patientInfo.first_name} {patientInfo.last_name}</h3>
                    <div className="flex items-center gap-2">
                      {patientInfo.gender && (
                        <Badge variant="outline" className="text-xs">{patientInfo.gender}</Badge>
                      )}
                      {patientInfo.date_of_birth && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(patientInfo.date_of_birth), 'dd.MM.yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {patientInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{patientInfo.phone}</span>
                    </div>
                  )}
                  {patientInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{patientInfo.email}</span>
                    </div>
                  )}
                  {(patientInfo.country || patientInfo.address) && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{[patientInfo.address, patientInfo.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Medical Info & Companion */}
              <div className="lg:w-80 space-y-2">
                {patientInfo.medical_condition && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-400">Tıbbi Durum:</span>
                    <p className="mt-1 text-amber-900 dark:text-amber-200 line-clamp-2">{patientInfo.medical_condition}</p>
                  </div>
                )}
                
                {patientInfo.allergies && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs">
                    <span className="font-medium text-red-700 dark:text-red-400">Alerjiler:</span>
                    <span className="ml-1 text-red-900 dark:text-red-200">{patientInfo.allergies}</span>
                  </div>
                )}

                {patientInfo.has_companion && patientInfo.companion_first_name && (
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <span className="font-medium">Refakatçi:</span>
                    <span className="ml-1">{patientInfo.companion_first_name} {patientInfo.companion_last_name}</span>
                    {patientInfo.companion_phone && (
                      <span className="ml-2 text-muted-foreground">({patientInfo.companion_phone})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notes">Notlar</TabsTrigger>
          <TabsTrigger value="payments">Ödemeler</TabsTrigger>
          <TabsTrigger value="transfers">Transferler</TabsTrigger>
          <TabsTrigger value="appointments">Randevular</TabsTrigger>
          <TabsTrigger value="documents">Belgeler</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Yeni Not Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="note_date">Tarih *</Label>
                    <Input
                      id="note_date"
                      type="date"
                      value={noteForm.note_date}
                      onChange={(e) => setNoteForm({...noteForm, note_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="note_content">Not *</Label>
                    <Textarea
                      id="note_content"
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                      placeholder="Notunuzu yazın..."
                      rows={2}
                      required
                    />
                  </div>
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Not Ekle
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Not Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Henüz not eklenmemiş</p>
              ) : (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex-shrink-0 w-24 text-center">
                        <div className="text-sm font-semibold text-primary">
                          {format(new Date(note.note_date), 'dd MMM')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(note.note_date), 'yyyy')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Eklenme: {format(new Date(note.created_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {/* Payment Summary Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Ödenen</p>
                  <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Borç</p>
                  <p className={`text-2xl font-bold ${remainingDebt > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    ${remainingDebt > 0 ? remainingDebt.toLocaleString() : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                  <p className="text-2xl font-bold text-foreground">${totalCost.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Yeni Ödeme Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount">Tutar *</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Tarih *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Ödeme Yöntemi</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({...paymentForm, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Nakit</SelectItem>
                        <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                        <SelectItem value="bank_transfer">Banka Transferi</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_notes">Not</Label>
                    <Input
                      id="payment_notes"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      placeholder="Açıklama..."
                    />
                  </div>
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Ödeme Ekle
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ödeme Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Henüz ödeme kaydı yok</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Yöntem</TableHead>
                      <TableHead>Not</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), 'dd.MM.yyyy')}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {payment.payment_method === 'cash' ? 'Nakit' :
                           payment.payment_method === 'credit_card' ? 'Kredi Kartı' :
                           payment.payment_method === 'bank_transfer' ? 'Banka Transferi' :
                           payment.payment_method === 'zelle' ? 'Zelle' :
                           payment.payment_method || '-'}
                        </TableCell>
                        <TableCell>{payment.notes || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePayment(payment.id, payment.amount)}
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

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Transfer Bilgisi Ekle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransfer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Klinik Adı</Label>
                    <Input
                      id="clinic_name"
                      value={transferForm.clinic_name}
                      onChange={(e) => setTransferForm({...transferForm, clinic_name: e.target.value})}
                      placeholder="Örn: ABC Dental"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flight_info">Uçuş Bilgisi</Label>
                    <Input
                      id="flight_info"
                      value={transferForm.flight_info}
                      onChange={(e) => setTransferForm({...transferForm, flight_info: e.target.value})}
                      placeholder="Örn: TK555 LAX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="airport_pickup_info">Havalimanı Karşılama</Label>
                    <Input
                      id="airport_pickup_info"
                      value={transferForm.airport_pickup_info}
                      onChange={(e) => setTransferForm({...transferForm, airport_pickup_info: e.target.value})}
                      placeholder="Örn: İstanbul Havalimanı Kapı 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer_datetime">Tarih & Saat *</Label>
                    <Input
                      id="transfer_datetime"
                      type="datetime-local"
                      value={transferForm.transfer_datetime}
                      onChange={(e) => setTransferForm({...transferForm, transfer_datetime: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer_notes">Not</Label>
                  <Textarea
                    id="transfer_notes"
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                    rows={2}
                    placeholder="Ek bilgiler..."
                  />
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Transfer Ekle
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {patientTransfers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Henüz transfer kaydı yok</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih & Saat</TableHead>
                      <TableHead>Klinik</TableHead>
                      <TableHead>Uçuş</TableHead>
                      <TableHead>Karşılama</TableHead>
                      <TableHead>Not</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientTransfers.map(transfer => (
                      <TableRow key={transfer.id}>
                        <TableCell>{format(new Date(transfer.transfer_datetime), 'dd.MM.yyyy HH:mm')}</TableCell>
                        <TableCell>{transfer.clinic_name || '-'}</TableCell>
                        <TableCell className="font-mono">{transfer.flight_info || '-'}</TableCell>
                        <TableCell>{transfer.airport_pickup_info || '-'}</TableCell>
                        <TableCell>{transfer.notes || '-'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTransfer(transfer.id)}
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
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Transfer</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map(apt => (
                      <TableRow key={apt.id}>
                        <TableCell>{format(new Date(apt.appointment_date), 'PPP p')}</TableCell>
                        <TableCell className="capitalize">{apt.status}</TableCell>
                        <TableCell>{apt.treatments?.name || '-'}</TableCell>
                        <TableCell>{apt.hotels?.hotel_name || '-'}</TableCell>
                        <TableCell>{apt.transfer_services?.company_name || '-'}</TableCell>
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
                  <Label htmlFor="document">File (PDF, PNG, JPEG, STL) *</Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.stl"
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
                              onClick={() => handleViewDocument(doc.file_path, doc.document_name, doc.document_type)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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

      </Tabs>

      {/* Document Viewer Dialog - inline PDF viewer using blob URL */}
      <Dialog open={!!viewingDocument} onOpenChange={() => {
        if (viewingDocument?.url) {
          URL.revokeObjectURL(viewingDocument.url);
        }
        setViewingDocument(null);
        setPageNumber(1);
        setNumPages(0);
      }}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewingDocument?.name}
            </DialogTitle>
            <DialogDescription>Belge önizleme</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto h-full">
            {viewingDocument?.type.includes('pdf') ? (
              <div className="flex flex-col items-center">
                <Document
                  file={viewingDocument.url}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={
                    <div className="flex items-center justify-center h-[calc(85vh-180px)]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-[calc(85vh-180px)] gap-4">
                      <FileText className="w-16 h-16 text-muted-foreground" />
                      <p className="text-muted-foreground">PDF yüklenemedi.</p>
                    </div>
                  }
                >
                  <Page 
                    pageNumber={pageNumber} 
                    width={Math.min(800, window.innerWidth - 100)}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
                {numPages > 0 && (
                  <div className="flex items-center gap-4 mt-4 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Sayfa {pageNumber} / {numPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                      disabled={pageNumber >= numPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : viewingDocument?.type.includes('image') ? (
              <div className="flex items-center justify-center h-[calc(85vh-120px)] overflow-auto">
                <img
                  src={viewingDocument.url}
                  alt={viewingDocument.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Bu dosya türü önizlenemiyor.</p>
                <Button onClick={() => viewingDocument && window.open(viewingDocument.url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Yeni Sekmede Aç
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
