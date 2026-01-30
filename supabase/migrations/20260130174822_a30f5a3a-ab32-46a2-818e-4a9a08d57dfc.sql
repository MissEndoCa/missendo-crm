-- Tighten overly-permissive RLS policy on audit_logs (fix linter: WITH CHECK (true))
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='audit_logs' AND policyname='System can insert audit logs'
  ) THEN
    EXECUTE 'DROP POLICY "System can insert audit logs" ON public.audit_logs';
  END IF;
END $$;

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);
