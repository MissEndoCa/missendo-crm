-- Add UPDATE policy for super admins on patient_documents
CREATE POLICY "Super admins can update patient documents"
ON public.patient_documents
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));