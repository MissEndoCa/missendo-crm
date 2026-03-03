
-- Allow super admins and clinic users to update call logs
CREATE POLICY "Super admins can update call logs"
ON public.reminder_call_logs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

CREATE POLICY "Clinic users can update their own call logs"
ON public.reminder_call_logs
FOR UPDATE
TO authenticated
USING (called_by = auth.uid());

-- Also allow clinic users to manage call logs for their organization
CREATE POLICY "Clinic users can insert call logs"
ON public.reminder_call_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Clinic users can view their organization call logs"
ON public.reminder_call_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM reminders r
    WHERE r.id = reminder_call_logs.reminder_id
    AND (
      r.organization_id = get_user_organization(auth.uid())
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
    )
  )
);

CREATE POLICY "Clinic users can delete their own call logs"
ON public.reminder_call_logs
FOR DELETE
TO authenticated
USING (
  called_by = auth.uid()
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'super_admin')
);
