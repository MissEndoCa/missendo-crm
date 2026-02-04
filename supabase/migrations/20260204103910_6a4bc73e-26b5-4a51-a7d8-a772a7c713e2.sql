-- Create reminder_notify_users table for specific user notifications
CREATE TABLE public.reminder_notify_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reminder_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reminder_notify_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can view notify users"
ON public.reminder_notify_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert notify users"
ON public.reminder_notify_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete notify users"
ON public.reminder_notify_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_reminder_notify_users_reminder_id ON public.reminder_notify_users(reminder_id);