-- Drop existing conflicting policies for patient_notes
DROP POLICY IF EXISTS "Users can manage patient notes for their organization's patient" ON patient_notes;
DROP POLICY IF EXISTS "Users can view patient notes for their organization's patients" ON patient_notes;

-- Create proper policies for patient_notes
CREATE POLICY "Users can view patient notes for their organization" 
ON patient_notes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_notes.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can insert patient notes for their organization" 
ON patient_notes FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_notes.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can update patient notes for their organization" 
ON patient_notes FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_notes.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can delete patient notes for their organization" 
ON patient_notes FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_notes.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- Drop existing conflicting policies for patient_documents
DROP POLICY IF EXISTS "Users can manage patient documents for their organization's pat" ON patient_documents;
DROP POLICY IF EXISTS "Users can view patient documents for their organization's patie" ON patient_documents;

-- Create proper policies for patient_documents
CREATE POLICY "Users can view patient documents for their organization" 
ON patient_documents FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_documents.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can insert patient documents for their organization" 
ON patient_documents FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_documents.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can update patient documents for their organization" 
ON patient_documents FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_documents.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can delete patient documents for their organization" 
ON patient_documents FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_documents.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- Also fix storage policies - drop conflicting ones
DROP POLICY IF EXISTS "Users can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient documents" ON storage.objects;

-- Create clean storage policies for patient-documents bucket
CREATE POLICY "Authenticated users can upload patient documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'patient-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view patient documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'patient-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update patient documents" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'patient-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete patient documents" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'patient-documents' 
  AND auth.role() = 'authenticated'
);