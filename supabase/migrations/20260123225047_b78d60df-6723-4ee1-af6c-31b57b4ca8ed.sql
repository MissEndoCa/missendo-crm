-- Add new pricing columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS estimated_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS downpayment numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS clinic_payment numeric DEFAULT 0;

-- Migrate existing data: move total_cost to estimated_price and final_price
UPDATE public.patients 
SET 
  estimated_price = COALESCE(total_cost, 0),
  final_price = COALESCE(total_cost, 0)
WHERE total_cost IS NOT NULL AND total_cost > 0;

-- Add comment to clarify the new structure
COMMENT ON COLUMN public.patients.estimated_price IS 'Initial estimated price for the patient treatment';
COMMENT ON COLUMN public.patients.final_price IS 'Final agreed price for the patient treatment';
COMMENT ON COLUMN public.patients.downpayment IS 'Downpayment/deposit received from patient';
COMMENT ON COLUMN public.patients.clinic_payment IS 'Payment made directly to the clinic';