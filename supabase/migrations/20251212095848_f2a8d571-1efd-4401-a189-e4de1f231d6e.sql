-- Add patient_id and payment_method columns to income_expenses table
ALTER TABLE public.income_expenses 
ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method text;