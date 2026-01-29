-- Add policy for super admins to manage all patient notes
CREATE POLICY "Super admins can manage all patient notes" 
ON public.patient_notes 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));