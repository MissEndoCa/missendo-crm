
-- Fix RLS policies to allow clinic users to see data for patients in their organization
-- The issue is that notes/payments/transfers/documents were created with super admin's org_id
-- but patients belong to clinic org_id. We need to check patient's organization instead.

-- Drop existing problematic policies and recreate them

-- PATIENT NOTES: Allow access based on patient's organization
DROP POLICY IF EXISTS "Users can manage their organization's patient notes" ON public.patient_notes;
DROP POLICY IF EXISTS "Users can view their organization's patient notes" ON public.patient_notes;

CREATE POLICY "Users can view patient notes for their organization's patients" 
ON public.patient_notes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_notes.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can manage patient notes for their organization's patients" 
ON public.patient_notes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_notes.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- PATIENT PAYMENTS: Allow access based on patient's organization
DROP POLICY IF EXISTS "Users can manage their organization's patient payments" ON public.patient_payments;
DROP POLICY IF EXISTS "Users can view their organization's patient payments" ON public.patient_payments;

CREATE POLICY "Users can view patient payments for their organization's patients" 
ON public.patient_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_payments.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can manage patient payments for their organization's patients" 
ON public.patient_payments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_payments.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- PATIENT TRANSFERS: Allow access based on patient's organization
DROP POLICY IF EXISTS "Users can manage their organization's patient transfers" ON public.patient_transfers;
DROP POLICY IF EXISTS "Users can view their organization's patient transfers" ON public.patient_transfers;

CREATE POLICY "Users can view patient transfers for their organization's patients" 
ON public.patient_transfers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_transfers.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can manage patient transfers for their organization's patients" 
ON public.patient_transfers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_transfers.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- PATIENT DOCUMENTS: Allow access based on patient's organization
DROP POLICY IF EXISTS "Users can manage their organization's patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Users can view their organization's patient documents" ON public.patient_documents;

CREATE POLICY "Users can view patient documents for their organization's patients" 
ON public.patient_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can manage patient documents for their organization's patients" 
ON public.patient_documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

-- APPOINTMENTS: Update to also check patient's organization
DROP POLICY IF EXISTS "Users can view appointments in their organization" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert appointments in their organization" ON public.appointments;
DROP POLICY IF EXISTS "Users can update appointments in their organization" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete appointments in their organization" ON public.appointments;

CREATE POLICY "Users can view appointments for their organization's patients" 
ON public.appointments 
FOR SELECT 
USING (
  organization_id = get_user_organization(auth.uid())
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = appointments.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can insert appointments for their organization's patients" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  organization_id = get_user_organization(auth.uid())
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = appointments.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can update appointments for their organization's patients" 
ON public.appointments 
FOR UPDATE 
USING (
  organization_id = get_user_organization(auth.uid())
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = appointments.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can delete appointments for their organization's patients" 
ON public.appointments 
FOR DELETE 
USING (
  organization_id = get_user_organization(auth.uid())
  OR EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = appointments.patient_id 
    AND patients.organization_id = get_user_organization(auth.uid())
  )
);
