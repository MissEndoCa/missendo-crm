-- Create reminder_call_logs table to track call attempts
CREATE TABLE public.reminder_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  call_result TEXT NOT NULL CHECK (call_result IN ('reached', 'unreached', 'no_answer', 'busy', 'wrong_number')),
  notes TEXT,
  called_by UUID REFERENCES public.profiles(id),
  called_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can view all call logs"
ON public.reminder_call_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can insert call logs"
ON public.reminder_call_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete call logs"
ON public.reminder_call_logs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_reminder_call_logs_reminder_id ON public.reminder_call_logs(reminder_id);
CREATE INDEX idx_reminder_call_logs_called_at ON public.reminder_call_logs(called_at DESC);