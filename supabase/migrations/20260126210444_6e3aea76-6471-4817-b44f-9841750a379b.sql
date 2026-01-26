-- Add column to track notification preference
ALTER TABLE public.reminders 
ADD COLUMN notify_all_admins BOOLEAN DEFAULT false;