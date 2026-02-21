
CREATE OR REPLACE FUNCTION public.notify_new_lead_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://xzcpxatfzgusrxfreeoi.supabase.co';
BEGIN
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_new_lead_email failed: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;
