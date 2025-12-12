-- Add origin and destination columns to patient_transfers table
ALTER TABLE public.patient_transfers
ADD COLUMN origin text,
ADD COLUMN destination text;