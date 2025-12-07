-- Add treatment_plan_pdf column to patient_treatments table
ALTER TABLE public.patient_treatments 
ADD COLUMN IF NOT EXISTS treatment_plan_pdf text DEFAULT NULL;

-- Add treatment_date column to patient_treatments table  
ALTER TABLE public.patient_treatments
ADD COLUMN IF NOT EXISTS treatment_date date DEFAULT NULL;

-- Create storage bucket for treatment plans
INSERT INTO storage.buckets (id, name, public)
VALUES ('treatment-plans', 'treatment-plans', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload treatment plans for their organization's patients
CREATE POLICY "Users can upload treatment plans for their org patients"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'treatment-plans' AND
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.organization_id = get_user_organization(auth.uid())
  )
);

-- Storage policy: Users can view treatment plans for their organization's patients
CREATE POLICY "Users can view treatment plans for their org patients"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'treatment-plans' AND
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.organization_id = get_user_organization(auth.uid())
  )
);

-- Storage policy: Users can delete treatment plans for their organization's patients
CREATE POLICY "Users can delete treatment plans for their org patients"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'treatment-plans' AND
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id::text = (storage.foldername(name))[1]
    AND p.organization_id = get_user_organization(auth.uid())
  )
);

-- Storage policy: Super admins can manage all treatment plans
CREATE POLICY "Super admins can manage all treatment plans"
ON storage.objects FOR ALL
USING (
  bucket_id = 'treatment-plans' AND
  has_role(auth.uid(), 'super_admin'::app_role)
);