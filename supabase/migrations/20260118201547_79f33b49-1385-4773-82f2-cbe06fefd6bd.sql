-- Drop the existing policy that allows any org user to delete
DROP POLICY IF EXISTS "Users can delete their organization's patients" ON public.patients;

-- Create new policy: Only creator or clinic_admin of the org can delete
CREATE POLICY "Users can delete patients they created or as clinic admin" 
ON public.patients 
FOR DELETE 
USING (
  -- User is in the same organization AND (is the creator OR is a clinic_admin)
  organization_id = get_user_organization(auth.uid())
  AND (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'clinic_admin'::app_role)
  )
);