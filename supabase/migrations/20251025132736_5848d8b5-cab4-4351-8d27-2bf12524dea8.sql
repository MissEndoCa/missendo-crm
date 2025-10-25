-- Add companion fields to patients table
ALTER TABLE public.patients
ADD COLUMN has_companion BOOLEAN DEFAULT false,
ADD COLUMN companion_first_name TEXT,
ADD COLUMN companion_last_name TEXT,
ADD COLUMN companion_phone TEXT,
ADD COLUMN companion_id_number TEXT;

-- Create patient_documents table
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_documents
CREATE POLICY "Users can view their organization's patient documents"
ON public.patient_documents FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's patient documents"
ON public.patient_documents FOR ALL
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Super admins can view all patient documents"
ON public.patient_documents FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_patient_documents_updated_at
BEFORE UPDATE ON public.patient_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create patient-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false);

-- RLS policies for patient-documents bucket
CREATE POLICY "Users can view their organization's patient documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can upload patient documents for their organization"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can update patient documents for their organization"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'patient-documents' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can delete patient documents for their organization"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-documents' AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);