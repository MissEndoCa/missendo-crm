import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/TimePicker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar, FileText, Plus, Upload, Download, Trash2, Eye, MessageSquare, CreditCard, Plane, DollarSign, User, Phone, Mail, MapPin, ExternalLink, ChevronLeft, ChevronRight, Pencil, Video, Image, Scan } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  duration_minutes: number | null;
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
  category: 'photo' | 'xray' | 'document';
}

interface PatientNote {
  id: string;
  note_date: string;
  content: string;
  created_at: string;
  created_by: string | null;
  creator?: {
    first_name: string;
    last_name: string;
  } | null;
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
  hotel_id: string | null;
  hotels?: { hotel_name: string } | null;
  origin: string | null;
  destination: string | null;
  transfer_type: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  airline: string | null;
  departure_time: string | null;
  arrival_time: string | null;
}

export function PatientDetails({ patientId, onClose }: PatientDetailsProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [payments, setPayments] = useState<PatientPayment[]>([]);
  const [patientTransfers, setPatientTransfers] = useState<PatientTransfer[]>([]);
  const [patientInfo, setPatientInfo] = useState<{ 
    total_cost: number; 
    total_paid: number;
    estimated_price: number;
    final_price: number;
    downpayment: number;
    clinic_payment: number;
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
  const [activeTab, setActiveTab] = useState('notes');

  const [appointmentForm, setAppointmentForm] = useState({
    appointment_date: '',
    appointment_time: '',
    duration_minutes: '60',
    appointment_type: '',
    notes: ''
  });

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentNotes, setDocumentNotes] = useState('');
  const [documentCategory, setDocumentCategory] = useState<'photo' | 'xray' | 'document'>('document');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<{ id: string; name: string } | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [documentThumbnails, setDocumentThumbnails] = useState<Record<string, string>>({});

  const [noteForm, setNoteForm] = useState({
    note_date: new Date().toISOString().split('T')[0],
    content: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    payment_type: 'downpayment' as 'downpayment' | 'clinic_payment',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    transfer_type: 'arrival' as 'arrival' | 'departure',
    transfer_date: '',
    departure_airport: '',
    arrival_airport: '',
    airline: '',
    flight_info: '',
    departure_time: '',
    arrival_time: '',
    airport_pickup_info: '',
    notes: '',
    hotel_id: '',
  });

  const [hotelBookingForm, setHotelBookingForm] = useState({
    hotel_id: '',
    room_type: 'single',
    check_in_date: '',
    nights_count: '',
    has_companion: false,
  });

  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, documentsRes, notesRes, paymentsRes, patientTransfersRes, patientRes, hotelsRes, transfersRes, treatmentsRes, patientTreatmentsRes, organizationsRes] = await Promise.all([
        supabase.from('appointments').select('*, treatments(name), hotels(hotel_name), transfer_services(company_name)').eq('patient_id', patientId),
        supabase.from('patient_documents').select('*').eq('patient_id', patientId),
        supabase.from('patient_notes').select('*, creator:profiles!patient_notes_created_by_fkey(first_name, last_name)').eq('patient_id', patientId).order('note_date', { ascending: false }),
        supabase.from('patient_payments').select('*').eq('patient_id', patientId).order('payment_date', { ascending: false }),
        supabase.from('patient_transfers').select('*, hotels(hotel_name)').eq('patient_id', patientId).order('transfer_datetime', { ascending: false }),
        supabase.from('patients').select('total_cost, total_paid, first_name, last_name, email, phone, date_of_birth, gender, country, address, medical_condition, allergies, notes, photo_url, has_companion, companion_first_name, companion_last_name, companion_phone').eq('id', patientId).maybeSingle(),
        supabase.from('hotels').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('transfer_services').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('treatments').select('*').eq('organization_id', profile?.organization_id),
        supabase.from('patient_treatments').select('final_price').eq('patient_id', patientId),
        supabase.from('organizations').select('id, name').eq('is_active', true)
      ]);

      // Calculate total cost from patient treatments
      const treatmentTotal = (patientTreatmentsRes.data || []).reduce((sum, t) => sum + (Number(t.final_price) || 0), 0);
      
      setAppointments(appointmentsRes.data || []);
      setDocuments((documentsRes.data || []).map(doc => ({
        ...doc,
        category: (doc.category as 'photo' | 'xray' | 'document') || 'document'
      })));
      setNotes((notesRes.data || []) as PatientNote[]);
      setPayments(paymentsRes.data || []);
      setPatientTransfers(patientTransfersRes.data || []);
      // Use calculated treatment total if total_cost is 0 or null
      const patientData = patientRes.data as any;
      if (patientData) {
        const dbTotalCost = patientData.total_cost || 0;
        setPatientInfo({
          ...patientData,
          total_cost: dbTotalCost > 0 ? dbTotalCost : treatmentTotal,
          estimated_price: patientData.estimated_price || 0,
          final_price: patientData.final_price || 0,
          downpayment: patientData.downpayment || 0,
          clinic_payment: patientData.clinic_payment || 0,
          total_paid: patientData.total_paid || 0
        });
      }
      setHotels(hotelsRes.data || []);
      setTransfers(transfersRes.data || []);
      setTreatments(treatmentsRes.data || []);
      setOrganizations(organizationsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const localDate = new Date(`${appointmentForm.appointment_date}T${appointmentForm.appointment_time}:00`);
      const appointmentDateTime = localDate.toISOString();
      
      const { error } = await supabase.from('appointments').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        appointment_date: appointmentDateTime,
        duration_minutes: parseInt(appointmentForm.duration_minutes) || 60,
        notes: appointmentForm.appointment_type ? `${appointmentForm.appointment_type}${appointmentForm.notes ? ': ' + appointmentForm.notes : ''}` : appointmentForm.notes || null,
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
        appointment_time: '',
        duration_minutes: '60',
        appointment_type: '',
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

  const handleFileSelectAndShowCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setDocumentFiles(Array.from(files));
      // Auto-detect category based on file type
      const firstFile = files[0];
      if (firstFile.type.includes('image')) {
        setDocumentCategory('photo');
      } else {
        setDocumentCategory('document');
      }
      setShowCategoryDialog(true);
    }
  };

  const handleUploadDocuments = async () => {
    if (documentFiles.length === 0) return;

    setShowCategoryDialog(false);
    setUploadingDocuments(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of documentFiles) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('patient-documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from('patient_documents').insert([{
            patient_id: patientId,
            organization_id: profile?.organization_id,
            document_name: file.name,
            document_type: file.type,
            file_path: fileName,
            file_size: file.size,
            uploaded_by: profile?.id,
            notes: documentNotes || null,
            category: documentCategory
          }]);

          if (dbError) throw dbError;
          successCount++;
        } catch (err) {
          console.error('Error uploading file:', file.name, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} file(s) uploaded as ${documentCategory === 'photo' ? 'Photos' : documentCategory === 'xray' ? 'X-Rays' : 'Documents'}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to upload files',
          variant: 'destructive'
        });
      }

      setDocumentFiles([]);
      setDocumentNotes('');
      setDocumentCategory('document');
      loadData();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while uploading files',
        variant: 'destructive'
      });
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDocumentFiles(Array.from(files));
    }
  };

  const removeSelectedFile = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Load thumbnails for image documents (both photos and xrays)
  useEffect(() => {
    const loadThumbnails = async () => {
      const imageDocuments = documents.filter(doc => 
        doc.document_type.includes('image') && (doc.category === 'photo' || doc.category === 'xray')
      );
      
      const newThumbnails: Record<string, string> = {};
      
      for (const doc of imageDocuments) {
        if (!documentThumbnails[doc.id]) {
          try {
            const { data } = await supabase.storage
              .from('patient-documents')
              .download(doc.file_path);
            
            if (data) {
              newThumbnails[doc.id] = URL.createObjectURL(data);
            }
          } catch (err) {
            console.error('Error loading thumbnail:', err);
          }
        }
      }
      
      if (Object.keys(newThumbnails).length > 0) {
        setDocumentThumbnails(prev => ({ ...prev, ...newThumbnails }));
      }
    };

    if (documents.length > 0) {
      loadThumbnails();
    }

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(documentThumbnails).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [documents]);

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
        title: 'Error',
        description: 'Failed to view document',
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

  const handleRenameDocument = async (documentId: string, newName: string) => {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .update({ document_name: newName, updated_at: new Date().toISOString() })
        .eq('id', documentId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No document was updated');
      }

      // Update documents state directly for immediate UI update
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, document_name: newName } : doc
      ));

      toast({
        title: 'Success',
        description: 'Document renamed successfully'
      });

      setEditingDocument(null);
    } catch (error) {
      console.error('Error renaming document:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename document',
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

  const handleEditAppointment = (apt: Appointment) => {
    const aptDate = new Date(apt.appointment_date);
    setEditingAppointment(apt);
    setAppointmentForm({
      appointment_date: format(aptDate, 'yyyy-MM-dd'),
      appointment_time: format(aptDate, 'HH:mm'),
      duration_minutes: String(apt.duration_minutes || 60),
      appointment_type: apt.notes?.startsWith('Examination') ? 'Examination' : apt.notes?.startsWith('Procedure') ? 'Procedure' : '',
      notes: apt.notes?.replace(/^(Examination|Procedure)(: )?/, '') || ''
    });
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      const localDate = new Date(`${appointmentForm.appointment_date}T${appointmentForm.appointment_time}:00`);
      const appointmentDateTime = localDate.toISOString();
      
      const { error } = await supabase.from('appointments').update({
        appointment_date: appointmentDateTime,
        duration_minutes: parseInt(appointmentForm.duration_minutes) || 60,
        notes: appointmentForm.appointment_type ? `${appointmentForm.appointment_type}${appointmentForm.notes ? ': ' + appointmentForm.notes : ''}` : appointmentForm.notes || null,
      }).eq('id', editingAppointment.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment updated successfully'
      });

      setEditingAppointment(null);
      setAppointmentForm({
        appointment_date: '',
        appointment_time: '',
        duration_minutes: '60',
        appointment_type: '',
        notes: ''
      });

      loadData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update appointment',
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
        title: 'Success',
        description: 'Note added'
      });

      setNoteForm({
        note_date: new Date().toISOString().split('T')[0],
        content: ''
      });

      loadData();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
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
        title: 'Success',
        description: 'Note deleted'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
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
        notes: paymentForm.notes ? `[${paymentForm.payment_type === 'downpayment' ? 'Downpayment' : 'Clinic Payment'}] ${paymentForm.notes}` : `[${paymentForm.payment_type === 'downpayment' ? 'Downpayment' : 'Clinic Payment'}]`,
        created_by: profile?.id
      }]);

      if (error) throw error;

      // Update the appropriate payment field based on payment type
      const updateData: any = {
        total_paid: (patientInfo?.total_paid || 0) + paymentAmount
      };
      
      if (paymentForm.payment_type === 'downpayment') {
        updateData.downpayment = (patientInfo?.downpayment || 0) + paymentAmount;
      } else {
        updateData.clinic_payment = (patientInfo?.clinic_payment || 0) + paymentAmount;
      }

      await supabase.from('patients').update(updateData).eq('id', patientId);

      // Also add to income_expenses for accounting
      const patientFullName = `${patientInfo?.first_name || ''} ${patientInfo?.last_name || ''}`.trim();
      await supabase.from('income_expenses').insert([{
        organization_id: profile?.organization_id,
        type: 'income',
        category: paymentForm.payment_type === 'downpayment' ? 'Downpayment' : 'Clinic Payment',
        amount: paymentAmount,
        currency: 'USD',
        description: `${paymentForm.payment_type === 'downpayment' ? 'Downpayment' : 'Clinic payment'}: ${patientFullName}`,
        reference_type: 'patient_payment',
        reference_id: patientId,
        patient_id: patientId,
        payment_method: paymentForm.payment_method || null,
        notes: paymentForm.notes || null,
        created_by: profile?.id
      }]);

      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      });

      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        payment_type: 'downpayment',
        notes: ''
      });

      loadData();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
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
        title: 'Success',
        description: 'Payment deleted'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive'
      });
    }
  };

  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.transfer_date) return;

    try {
      // Combine date and time for transfer_datetime
      const transferDatetime = transferForm.departure_time 
        ? `${transferForm.transfer_date}T${transferForm.departure_time}:00`
        : `${transferForm.transfer_date}T12:00:00`;

      const { error } = await supabase.from('patient_transfers').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        transfer_type: transferForm.transfer_type,
        departure_airport: transferForm.departure_airport || null,
        arrival_airport: transferForm.arrival_airport || null,
        airline: transferForm.airline || null,
        flight_info: transferForm.flight_info || null,
        departure_time: transferForm.departure_time || null,
        arrival_time: transferForm.arrival_time || null,
        airport_pickup_info: transferForm.airport_pickup_info || null,
        transfer_datetime: transferDatetime,
        notes: transferForm.notes || null,
        hotel_id: transferForm.hotel_id || null,
        created_by: profile?.id
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transfer info added'
      });

      setTransferForm({
        transfer_type: 'arrival',
        transfer_date: '',
        departure_airport: '',
        arrival_airport: '',
        airline: '',
        flight_info: '',
        departure_time: '',
        arrival_time: '',
        airport_pickup_info: '',
        notes: '',
        hotel_id: '',
      });

      loadData();
    } catch (error) {
      console.error('Error adding transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transfer info',
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
        title: 'Success',
        description: 'Transfer info deleted'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transfer info',
        variant: 'destructive'
      });
    }
  };

  const getRoomPrice = (hotel: any, roomType: string) => {
    switch (roomType) {
      case 'single': return hotel.single_room_price || hotel.price_per_night;
      case 'double': return hotel.double_room_price || hotel.price_per_night;
      case 'family': return hotel.family_room_price || hotel.price_per_night;
      default: return hotel.price_per_night;
    }
  };

  const handleAddHotelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelBookingForm.hotel_id || !hotelBookingForm.check_in_date || !hotelBookingForm.nights_count) return;

    try {
      const selectedHotel = hotels.find(h => h.id === hotelBookingForm.hotel_id);
      if (!selectedHotel) return;

      const roomPrice = getRoomPrice(selectedHotel, hotelBookingForm.room_type);
      const nights = parseInt(hotelBookingForm.nights_count);
      let totalCost = roomPrice * nights;
      
      if (hotelBookingForm.has_companion && selectedHotel.companion_price) {
        totalCost += selectedHotel.companion_price * nights;
      }

      // Calculate check-out date
      const checkIn = new Date(hotelBookingForm.check_in_date);
      checkIn.setDate(checkIn.getDate() + nights);
      const checkOutDate = checkIn.toISOString().split('T')[0];

      // Create appointment with hotel booking
      const { error: aptError } = await supabase.from('appointments').insert([{
        patient_id: patientId,
        organization_id: profile?.organization_id,
        appointment_date: `${hotelBookingForm.check_in_date}T12:00:00`,
        hotel_id: hotelBookingForm.hotel_id,
        room_type: hotelBookingForm.room_type,
        check_in_date: hotelBookingForm.check_in_date,
        check_out_date: checkOutDate,
        nights_count: nights,
        has_companion: hotelBookingForm.has_companion,
        notes: `Hotel Booking: ${selectedHotel.hotel_name} - ${hotelBookingForm.room_type} room`,
        status: 'scheduled',
        created_by: profile?.id
      }]);

      if (aptError) throw aptError;

      // Add to income_expenses for accounting
      await supabase.from('income_expenses').insert([{
        organization_id: profile?.organization_id,
        type: 'expense',
        category: 'Hotel Accommodation',
        amount: totalCost,
        currency: selectedHotel.currency || 'USD',
        description: `Hotel: ${selectedHotel.hotel_name} - ${hotelBookingForm.room_type} room x ${nights} nights`,
        date: hotelBookingForm.check_in_date,
        reference_type: 'hotel_booking',
        notes: `Patient: ${patientInfo?.first_name} ${patientInfo?.last_name}`,
        created_by: profile?.id
      }]);

      toast({
        title: 'Success',
        description: 'Hotel booking added'
      });

      setHotelBookingForm({
        hotel_id: '',
        room_type: 'single',
        check_in_date: '',
        nights_count: '',
        has_companion: false,
      });

      loadData();
    } catch (error) {
      console.error('Error adding hotel booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to add hotel booking',
        variant: 'destructive'
      });
    }
  };

  // New pricing structure
  const estimatedPrice = patientInfo?.estimated_price || 0;
  const finalPrice = patientInfo?.final_price || 0;
  const downpayment = patientInfo?.downpayment || 0;
  const clinicPayment = patientInfo?.clinic_payment || 0;
  const totalPaid = downpayment + clinicPayment;
  const remainingDebt = finalPrice - totalPaid;

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
                    <span className="font-medium text-amber-700 dark:text-amber-400">Medical Condition:</span>
                    <p className="mt-1 text-amber-900 dark:text-amber-200 line-clamp-2">{patientInfo.medical_condition}</p>
                  </div>
                )}
                
                {patientInfo.allergies && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs">
                    <span className="font-medium text-red-700 dark:text-red-400">Allergies:</span>
                    <span className="ml-1 text-red-900 dark:text-red-200">{patientInfo.allergies}</span>
                  </div>
                )}

                {patientInfo.has_companion && patientInfo.companion_first_name && (
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <span className="font-medium">Companion:</span>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: Dropdown Select for Tabs */}
        {isMobile ? (
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {activeTab === 'notes' && <MessageSquare className="w-4 h-4" />}
                  {activeTab === 'payments' && <CreditCard className="w-4 h-4" />}
                  {activeTab === 'transfers' && <Plane className="w-4 h-4" />}
                  {activeTab === 'appointments' && <Calendar className="w-4 h-4" />}
                  {activeTab === 'documents' && <FileText className="w-4 h-4" />}
                  <span>
                    {activeTab === 'notes' && 'Notes'}
                    {activeTab === 'payments' && 'Payments'}
                    {activeTab === 'transfers' && 'Transfers'}
                    {activeTab === 'appointments' && 'Appointments'}
                    {activeTab === 'documents' && 'Documents'}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="notes">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notes
                </div>
              </SelectItem>
              <SelectItem value="payments">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payments
                </div>
              </SelectItem>
              <SelectItem value="transfers">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Transfers
                </div>
              </SelectItem>
              <SelectItem value="appointments">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Appointments
                </div>
              </SelectItem>
              <SelectItem value="documents">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          /* Desktop: Original TabsList */
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notes">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="transfers">
              <Plane className="w-4 h-4 mr-2" />
              Transfers
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <MessageSquare className="h-5 w-5" />
                Add New Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="note_date">Date *</Label>
                    <Input
                      id="note_date"
                      type="date"
                      value={noteForm.note_date}
                      onChange={(e) => setNoteForm({...noteForm, note_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="note_content">Note *</Label>
                    <Textarea
                      id="note_content"
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                      placeholder="Write your note..."
                      rows={2}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Note History</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="flex flex-col md:flex-row gap-3 p-3 md:p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between md:block md:flex-shrink-0 md:w-20 md:text-center">
                        <div>
                          <div className="text-sm font-semibold text-primary">
                            {format(new Date(note.note_date), 'dd MMM')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(note.note_date), 'yyyy')}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="md:hidden"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.creator && (
                            <span className="font-medium">{note.creator.first_name} {note.creator.last_name}</span>
                          )}
                          {note.creator && ' • '}
                          {format(new Date(note.created_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hidden md:flex"
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

        <TabsContent value="payments" className="space-y-4 mt-4">
          {/* Payment Summary Card - New Structure */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4 md:pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 text-center">
                <div className="p-2 md:p-3 bg-muted/50 rounded-lg">
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Estimated</p>
                  <p className="text-sm md:text-lg font-semibold text-muted-foreground">${estimatedPrice.toLocaleString()}</p>
                </div>
                <div className="p-2 md:p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Final Price</p>
                  <p className="text-sm md:text-lg font-bold text-primary">${finalPrice.toLocaleString()}</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Downpayment</p>
                  <p className="text-sm md:text-lg font-semibold text-blue-600">${downpayment.toLocaleString()}</p>
                </div>
                <div className="p-2 md:p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Clinic Pay</p>
                  <p className="text-sm md:text-lg font-semibold text-green-600">${clinicPayment.toLocaleString()}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-lg border col-span-2 md:col-span-1 ${remainingDebt > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'}`}>
                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className={`text-sm md:text-lg font-bold ${remainingDebt > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    ${remainingDebt > 0 ? remainingDebt.toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CreditCard className="h-5 w-5" />
                Add New Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_type">Payment Type *</Label>
                    <Select value={paymentForm.payment_type} onValueChange={(value: 'downpayment' | 'clinic_payment') => setPaymentForm({...paymentForm, payment_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downpayment">Downpayment</SelectItem>
                        <SelectItem value="clinic_payment">Clinic Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount">Amount *</Label>
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
                    <Label htmlFor="payment_date">Date *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({...paymentForm, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_notes">Note</Label>
                    <Input
                      id="payment_notes"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                      placeholder="Description..."
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No payment records yet</p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {payments.map(payment => (
                      <div key={payment.id} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-green-600">${payment.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(payment.payment_date), 'dd.MM.yyyy')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {payment.payment_method === 'cash' ? 'Cash' :
                               payment.payment_method === 'credit_card' ? 'Card' :
                               payment.payment_method === 'bank_transfer' ? 'Transfer' :
                               payment.payment_method === 'zelle' ? 'Zelle' :
                               payment.payment_method || '-'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePayment(payment.id, payment.amount)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {payment.notes && <p className="text-xs text-muted-foreground mt-2">{payment.notes}</p>}
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Action</TableHead>
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
                              {payment.payment_method === 'cash' ? 'Cash' :
                               payment.payment_method === 'credit_card' ? 'Credit Card' :
                               payment.payment_method === 'bank_transfer' ? 'Bank Transfer' :
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Plane className="h-5 w-5" />
                Add Transfer Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransfer} className="space-y-4">
                {/* Transfer Type Selection */}
                <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="arrival"
                      name="transfer_type"
                      checked={transferForm.transfer_type === 'arrival'}
                      onChange={() => setTransferForm({...transferForm, transfer_type: 'arrival'})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="arrival" className="font-medium cursor-pointer text-green-700">Arrival</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="departure"
                      name="transfer_type"
                      checked={transferForm.transfer_type === 'departure'}
                      onChange={() => setTransferForm({...transferForm, transfer_type: 'departure'})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="departure" className="font-medium cursor-pointer text-blue-700">Departure</Label>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="transfer_date">Date *</Label>
                  <Input
                    id="transfer_date"
                    type="date"
                    value={transferForm.transfer_date}
                    onChange={(e) => setTransferForm({...transferForm, transfer_date: e.target.value})}
                    required
                  />
                </div>

                {/* Airports */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departure_airport">Departure Airport</Label>
                    <Input
                      id="departure_airport"
                      value={transferForm.departure_airport}
                      onChange={(e) => setTransferForm({...transferForm, departure_airport: e.target.value})}
                      placeholder="e.g., LAX, IST, JFK"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrival_airport">Arrival Airport</Label>
                    <Input
                      id="arrival_airport"
                      value={transferForm.arrival_airport}
                      onChange={(e) => setTransferForm({...transferForm, arrival_airport: e.target.value})}
                      placeholder="e.g., IST, SAW"
                    />
                  </div>
                </div>

                {/* Airline & Flight Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="airline">Airline</Label>
                    <Input
                      id="airline"
                      value={transferForm.airline}
                      onChange={(e) => setTransferForm({...transferForm, airline: e.target.value})}
                      placeholder="e.g., Turkish Airlines, Pegasus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flight_info">Flight Number</Label>
                    <Input
                      id="flight_info"
                      value={transferForm.flight_info}
                      onChange={(e) => setTransferForm({...transferForm, flight_info: e.target.value})}
                      placeholder="e.g., TK555"
                    />
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departure_time">Departure Time</Label>
                    <Input
                      id="departure_time"
                      type="time"
                      value={transferForm.departure_time}
                      onChange={(e) => setTransferForm({...transferForm, departure_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrival_time">Arrival Time</Label>
                    <Input
                      id="arrival_time"
                      type="time"
                      value={transferForm.arrival_time}
                      onChange={(e) => setTransferForm({...transferForm, arrival_time: e.target.value})}
                    />
                  </div>
                </div>

                {/* Airport Pickup & Hotel */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="airport_pickup_info">Airport Pickup</Label>
                    <Input
                      id="airport_pickup_info"
                      value={transferForm.airport_pickup_info}
                      onChange={(e) => setTransferForm({...transferForm, airport_pickup_info: e.target.value})}
                      placeholder="e.g., Gate 5, Terminal 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer_hotel">Hotel</Label>
                    <Select value={transferForm.hotel_id || "none"} onValueChange={(value) => setTransferForm({...transferForm, hotel_id: value === "none" ? "" : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No hotel</SelectItem>
                        {hotels.filter(h => h.is_active).map(hotel => (
                          <SelectItem key={hotel.id} value={hotel.id}>{hotel.hotel_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="transfer_notes">Note</Label>
                  <Textarea
                    id="transfer_notes"
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                    rows={2}
                    placeholder="Additional info..."
                  />
                </div>

                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transfer
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Hotel Booking Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Add Hotel Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddHotelBooking} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="booking_hotel">Hotel *</Label>
                    <Select 
                      value={hotelBookingForm.hotel_id || "none"} 
                      onValueChange={(value) => setHotelBookingForm({...hotelBookingForm, hotel_id: value === "none" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select a hotel</SelectItem>
                        {hotels.filter(h => h.is_active).map(hotel => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.hotel_name} {'⭐'.repeat(hotel.star_rating || 3)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room_type">Room Type *</Label>
                    <Select 
                      value={hotelBookingForm.room_type} 
                      onValueChange={(value) => setHotelBookingForm({...hotelBookingForm, room_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Room type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Room</SelectItem>
                        <SelectItem value="double">Double Room</SelectItem>
                        <SelectItem value="family">Family Room</SelectItem>
                      </SelectContent>
                    </Select>
                    {hotelBookingForm.hotel_id && (
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const hotel = hotels.find(h => h.id === hotelBookingForm.hotel_id);
                          if (!hotel) return '';
                          const price = getRoomPrice(hotel, hotelBookingForm.room_type);
                          return `Price: ${hotel.currency || 'USD'} ${price?.toFixed(2) || 'N/A'}/night`;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="booking_check_in">Check-in Date *</Label>
                    <Input
                      id="booking_check_in"
                      type="date"
                      value={hotelBookingForm.check_in_date}
                      onChange={(e) => setHotelBookingForm({...hotelBookingForm, check_in_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking_nights">Nights *</Label>
                    <Input
                      id="booking_nights"
                      type="number"
                      min="1"
                      value={hotelBookingForm.nights_count}
                      onChange={(e) => setHotelBookingForm({...hotelBookingForm, nights_count: e.target.value})}
                      placeholder="1"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="booking_companion"
                    checked={hotelBookingForm.has_companion}
                    onCheckedChange={(checked) => setHotelBookingForm({...hotelBookingForm, has_companion: checked as boolean})}
                  />
                  <Label htmlFor="booking_companion" className="font-normal cursor-pointer">Has Companion (+extra cost)</Label>
                </div>
                
                {hotelBookingForm.hotel_id && hotelBookingForm.nights_count && (
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Estimated Cost: </span>
                    <span className="font-bold">
                      {(() => {
                        const hotel = hotels.find(h => h.id === hotelBookingForm.hotel_id);
                        if (!hotel) return '-';
                        const roomPrice = getRoomPrice(hotel, hotelBookingForm.room_type);
                        const nights = parseInt(hotelBookingForm.nights_count) || 0;
                        let total = roomPrice * nights;
                        if (hotelBookingForm.has_companion && hotel.companion_price) {
                          total += hotel.companion_price * nights;
                        }
                        return `${hotel.currency || 'USD'} ${total.toFixed(2)}`;
                      })()}
                    </span>
                  </div>
                )}
                
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hotel Booking
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              {patientTransfers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No transfer records yet</p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {patientTransfers.map(transfer => (
                      <div key={transfer.id} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge variant={transfer.transfer_type === 'departure' ? "secondary" : "default"} className={transfer.transfer_type === 'departure' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                              {transfer.transfer_type === 'departure' ? 'Departure' : 'Arrival'}
                            </Badge>
                            <p className="text-sm font-semibold mt-1">{format(new Date(transfer.transfer_datetime), 'dd.MM.yyyy')}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteTransfer(transfer.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-mono">{transfer.departure_airport || transfer.origin || '?'} → {transfer.arrival_airport || transfer.destination || '?'}</p>
                          {transfer.airline && <p className="text-muted-foreground">{transfer.airline} • {transfer.flight_info || '-'}</p>}
                          <p className="text-xs text-muted-foreground">
                            {transfer.departure_time?.slice(0, 5) || '-'} - {transfer.arrival_time?.slice(0, 5) || '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Departure → Arrival</TableHead>
                          <TableHead>Airline</TableHead>
                          <TableHead>Flight No</TableHead>
                          <TableHead>Times</TableHead>
                          <TableHead>Pickup</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientTransfers.map(transfer => (
                          <TableRow key={transfer.id}>
                            <TableCell>
                              <Badge variant={transfer.transfer_type === 'departure' ? "secondary" : "default"} className={transfer.transfer_type === 'departure' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                                {transfer.transfer_type === 'departure' ? 'Departure' : 'Arrival'}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(transfer.transfer_datetime), 'dd.MM.yyyy')}</TableCell>
                            <TableCell className="font-mono">
                              {transfer.departure_airport || transfer.origin || '?'} → {transfer.arrival_airport || transfer.destination || '?'}
                            </TableCell>
                            <TableCell>{transfer.airline || '-'}</TableCell>
                            <TableCell className="font-mono">{transfer.flight_info || '-'}</TableCell>
                            <TableCell className="text-sm">
                              {transfer.departure_time?.slice(0, 5) || '-'} - {transfer.arrival_time?.slice(0, 5) || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{transfer.airport_pickup_info || '-'}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteTransfer(transfer.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {editingAppointment ? 'Edit Appointment' : 'Add Appointment'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingAppointment ? handleUpdateAppointment : handleAddAppointment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_date">Date *</Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      value={appointmentForm.appointment_date}
                      onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointment_time">Time *</Label>
                    <TimePicker
                      value={appointmentForm.appointment_time}
                      onValueChange={(value) => setAppointmentForm({ ...appointmentForm, appointment_time: value })}
                      stepMinutes={15}
                      placeholder="Select time"
                      className="w-full"
                      contentClassName="max-h-72"
                    />
                    <input
                      type="hidden"
                      name="appointment_time"
                      value={appointmentForm.appointment_time}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duration</Label>
                    <Select value={appointmentForm.duration_minutes} onValueChange={(value) => setAppointmentForm({...appointmentForm, duration_minutes: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="appointment_type">Type *</Label>
                    <Select value={appointmentForm.appointment_type} onValueChange={(value) => setAppointmentForm({...appointmentForm, appointment_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Examination">Examination</SelectItem>
                        <SelectItem value="Procedure">Procedure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                      placeholder="Additional details..."
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingAppointment ? (
                      <>
                        <Pencil className="w-4 h-4 mr-2" />
                        Update Appointment
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Appointment
                      </>
                    )}
                  </Button>
                  {editingAppointment && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setEditingAppointment(null);
                        setAppointmentForm({
                          appointment_date: '',
                          appointment_time: '',
                          duration_minutes: '60',
                          appointment_type: '',
                          notes: ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
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
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {appointments.map(apt => {
                      const aptDate = new Date(apt.appointment_date);
                      return (
                        <div key={apt.id} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{format(aptDate, 'dd.MM.yyyy')}</p>
                              <p className="text-sm text-muted-foreground">{format(aptDate, 'HH:mm')} • {apt.duration_minutes || 60} min</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="capitalize text-xs">{apt.status}</Badge>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditAppointment(apt)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDeleteAppointment(apt.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {apt.notes && <p className="text-xs text-muted-foreground">{apt.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map(apt => {
                          const aptDate = new Date(apt.appointment_date);
                          return (
                            <TableRow key={apt.id}>
                              <TableCell>{format(aptDate, 'dd.MM.yyyy')}</TableCell>
                              <TableCell>{format(aptDate, 'HH:mm')}</TableCell>
                              <TableCell>{apt.duration_minutes || 60} min</TableCell>
                              <TableCell className="capitalize">{apt.status}</TableCell>
                              <TableCell>{apt.notes || '-'}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleEditAppointment(apt)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteAppointment(apt.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document">Select Files (PDF, PNG, JPEG, STL, MP4, MOV) *</Label>
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.stl,.mp4,.mov,.avi,.webm"
                    onChange={handleFileSelectAndShowCategory}
                    multiple
                  />
                </div>
                {uploadingDocuments && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Uploading files...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos Gallery */}
          {documents.filter(doc => doc.category === 'photo').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Photos ({documents.filter(doc => doc.category === 'photo').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {documents
                    .filter(doc => doc.category === 'photo')
                    .map(doc => (
                      <div 
                        key={doc.id} 
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => handleViewDocument(doc.file_path, doc.document_name, doc.document_type)}
                      >
                        {documentThumbnails[doc.id] ? (
                          <img
                            src={documentThumbnails[doc.id]}
                            alt={doc.document_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* X-Rays Gallery */}
          {documents.filter(doc => doc.category === 'xray').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  X-Rays ({documents.filter(doc => doc.category === 'xray').length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {documents
                    .filter(doc => doc.category === 'xray')
                    .map(doc => (
                      <div 
                        key={doc.id} 
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => handleViewDocument(doc.file_path, doc.document_name, doc.document_type)}
                      >
                        {documentThumbnails[doc.id] ? (
                          <img
                            src={documentThumbnails[doc.id]}
                            alt={doc.document_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({documents.filter(doc => doc.category === 'document').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.filter(doc => doc.category === 'document').length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No documents uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {documents
                    .filter(doc => doc.category === 'document')
                    .map(doc => (
                      <Card key={doc.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              {doc.document_type.includes('video') && <Video className="w-5 h-5 text-primary" />}
                              {doc.document_type.includes('pdf') && <FileText className="w-5 h-5 text-destructive" />}
                              {!doc.document_type.includes('video') && !doc.document_type.includes('pdf') && <FileText className="w-5 h-5 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-tight">{doc.document_name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{format(new Date(doc.created_at), 'dd.MM.yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDocument(doc.file_path, doc.document_name, doc.document_type)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Görüntüle
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc.file_path, doc.document_name)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteDocument(doc.id, doc.file_path)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Category Selection Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCategoryDialog(false);
          setDocumentFiles([]);
          setDocumentCategory('document');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select File Category</DialogTitle>
            <DialogDescription>
              Choose where to save {documentFiles.length > 1 ? 'these files' : 'this file'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Selected files preview */}
            <div className="space-y-2">
              <Label>Selected Files ({documentFiles.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {documentFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                    {file.type.includes('image') && (
                      <img src={URL.createObjectURL(file)} alt="" className="w-6 h-6 object-cover rounded" />
                    )}
                    <span className="max-w-32 truncate text-xs">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                      onClick={() => {
                        const newFiles = documentFiles.filter((_, i) => i !== index);
                        if (newFiles.length === 0) {
                          setShowCategoryDialog(false);
                          setDocumentFiles([]);
                        } else {
                          setDocumentFiles(newFiles);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={documentCategory === 'photo' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setDocumentCategory('photo')}
                >
                  <Image className="h-5 w-5" />
                  <span className="text-xs">Photo</span>
                </Button>
                <Button
                  type="button"
                  variant={documentCategory === 'xray' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setDocumentCategory('xray')}
                >
                  <Scan className="h-5 w-5" />
                  <span className="text-xs">X-Ray</span>
                </Button>
                <Button
                  type="button"
                  variant={documentCategory === 'document' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setDocumentCategory('document')}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Document</span>
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="category-notes">Notes (optional)</Label>
              <Textarea
                id="category-notes"
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
                rows={2}
                placeholder="Add notes for these files..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowCategoryDialog(false);
              setDocumentFiles([]);
              setDocumentCategory('document');
            }}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocuments} disabled={uploadingDocuments}>
              <Upload className="w-4 h-4 mr-2" />
              {uploadingDocuments ? 'Uploading...' : `Upload as ${documentCategory === 'photo' ? 'Photo' : documentCategory === 'xray' ? 'X-Ray' : 'Document'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <DialogDescription>Document preview</DialogDescription>
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
                      <p className="text-muted-foreground">Failed to load PDF.</p>
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
                      Page {pageNumber} / {numPages}
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
            ) : viewingDocument?.type.includes('video') ? (
              <div className="flex items-center justify-center h-[calc(85vh-120px)]">
                <video
                  src={viewingDocument.url}
                  controls
                  className="max-w-full max-h-full"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">This file type cannot be previewed.</p>
                <Button onClick={() => viewingDocument && window.open(viewingDocument.url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
