-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the appointment reminder function to run every day at 8 AM
SELECT cron.schedule(
  'daily-appointment-reminders',
  '0 8 * * *', -- Every day at 8 AM
  $$
  SELECT
    net.http_post(
        url:='https://xzcpxatfzgusrxfreeoi.supabase.co/functions/v1/appointment-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Y3B4YXRmemd1c3J4ZnJlZW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODUxODYsImV4cCI6MjA3NjU2MTE4Nn0.bYenWN4DbJgGZ7WCEXM8mVwI0A7XkfalJ0obi-K4TD4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);