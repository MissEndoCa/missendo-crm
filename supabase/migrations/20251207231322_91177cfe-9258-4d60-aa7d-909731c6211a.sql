-- Create patient_payments table for tracking individual payments
CREATE TABLE public.patient_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create patient_transfers table for flight/transfer info
CREATE TABLE public.patient_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  clinic_name TEXT,
  flight_info TEXT,
  airport_pickup_info TEXT,
  transfer_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_payments
CREATE POLICY "Super admins can view all patient payments"
  ON public.patient_payments FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their organization's patient payments"
  ON public.patient_payments FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's patient payments"
  ON public.patient_payments FOR ALL
  USING (organization_id = get_user_organization(auth.uid()));

-- RLS policies for patient_transfers
CREATE POLICY "Super admins can view all patient transfers"
  ON public.patient_transfers FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their organization's patient transfers"
  ON public.patient_transfers FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can manage their organization's patient transfers"
  ON public.patient_transfers FOR ALL
  USING (organization_id = get_user_organization(auth.uid()));

-- Add total_cost column to patients table to track expected payment
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0;