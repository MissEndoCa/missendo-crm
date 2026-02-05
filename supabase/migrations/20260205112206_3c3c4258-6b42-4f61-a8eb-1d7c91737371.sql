-- Delete seed/test leads created at the same time (2026-01-28 07:48:48)
DELETE FROM public.leads 
WHERE created_at = '2026-01-28 07:48:48+00'
  AND first_name IN ('Ahmet', 'Fatma', 'Ayşe', 'Ali', 'Mehmet')
  AND last_name IN ('Yılmaz', 'Kaya', 'Öztürk', 'Çelik', 'Demir');

-- Enable pg_net extension if not already enabled (for HTTP calls from triggers)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to call send-new-lead-email edge function
CREATE OR REPLACE FUNCTION public.notify_new_lead_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT := 'https://xzcpxatfzgusrxfreeoi.supabase.co';
  service_role_key TEXT;
BEGIN
  -- Get service role key from vault (if available) or use anon key
  -- The edge function will use service role internally
  
  -- Call the edge function via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/send-new-lead-email',
    body := json_build_object(
      'lead_id', NEW.id,
      'organization_id', NEW.organization_id,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'phone', NEW.phone,
      'source', NEW.source
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Y3B4YXRmemd1c3J4ZnJlZW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODUxODYsImV4cCI6MjA3NjU2MTE4Nn0.bYenWN4DbJgGZ7WCEXM8mVwI0A7XkfalJ0obi-K4TD4'
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after lead insert
DROP TRIGGER IF EXISTS trigger_send_new_lead_email ON public.leads;
CREATE TRIGGER trigger_send_new_lead_email
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lead_email();