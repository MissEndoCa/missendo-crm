-- Create Miss Endo LLC organization
INSERT INTO public.organizations (name, email, phone, country, city, address, is_active)
VALUES (
  'Miss Endo LLC',
  'info@missendo.com',
  '+1-555-0100',
  'United States',
  'New York',
  '123 Medical Plaza, NY 10001',
  true
);

-- Expand lead status enum to include detailed workflow states
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'appointment_scheduled';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'will_not_come';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'converted_to_patient';

-- Add appointment_scheduled_date to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS appointment_scheduled_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS will_come boolean,
ADD COLUMN IF NOT EXISTS will_not_come_reason text;

-- Create notifications table index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read) 
WHERE is_read = false;