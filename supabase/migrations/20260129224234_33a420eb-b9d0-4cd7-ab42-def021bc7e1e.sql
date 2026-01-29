-- Allow super admins to INSERT patient notes
CREATE POLICY "Super admins can insert patient notes"
ON patient_notes FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
);

-- Allow super admins to UPDATE patient notes
CREATE POLICY "Super admins can update patient notes"
ON patient_notes FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
);

-- Allow super admins to DELETE patient notes
CREATE POLICY "Super admins can delete patient notes"
ON patient_notes FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
);