-- Create clinic category enum
CREATE TYPE public.clinic_category AS ENUM ('hair', 'dental', 'aesthetic');

-- Create partner_clinics table
CREATE TABLE public.partner_clinics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category clinic_category NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_clinics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_clinics
CREATE POLICY "Super admins can view all partner clinics"
ON public.partner_clinics
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their organization's partner clinics"
ON public.partner_clinics
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Clinic admins can manage their organization's partner clinics"
ON public.partner_clinics
FOR ALL
USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'clinic_admin'::app_role));

-- Add partner_clinic_id to patients table
ALTER TABLE public.patients ADD COLUMN partner_clinic_id UUID REFERENCES public.partner_clinics(id);

-- Create trigger for updated_at
CREATE TRIGGER update_partner_clinics_updated_at
BEFORE UPDATE ON public.partner_clinics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();