-- Tighten notifications INSERT policy (avoid WITH CHECK true) while still allowing trigger-generated inserts

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "System/authorized can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  -- allow DB triggers to insert notifications for other users
  pg_trigger_depth() > 0
  OR
  -- allow a user to insert notifications only for themselves
  user_id = auth.uid()
  OR
  -- super_admin can insert notifications
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- clinic_admin can insert notifications within their org
  (
    has_role(auth.uid(), 'clinic_admin'::app_role)
    AND organization_id = get_user_organization(auth.uid())
  )
);
