-- Add check-in and check-out date columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS check_in_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS check_out_date date DEFAULT NULL;