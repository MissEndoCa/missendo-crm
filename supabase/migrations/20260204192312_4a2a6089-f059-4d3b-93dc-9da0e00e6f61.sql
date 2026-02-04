-- Drop the existing policy that doesn't have proper with_check for super admins
DROP POLICY IF EXISTS "Super admins can view all patient transfers" ON public.patient_transfers;

-- Create a complete policy for super admins to view, insert, update, delete
CREATE POLICY "Super admins can manage all patient transfers"
  ON public.patient_transfers
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));