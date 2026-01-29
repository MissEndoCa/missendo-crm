-- Ensure patient_documents / patient_notes organization_id always matches the linked patient

-- 1) Trigger function
CREATE OR REPLACE FUNCTION public.set_organization_id_from_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
BEGIN
  IF NEW.patient_id IS NULL THEN
    RAISE EXCEPTION 'patient_id is required';
  END IF;

  SELECT organization_id INTO v_org
  FROM public.patients
  WHERE id = NEW.patient_id;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Invalid patient_id (no patient found): %', NEW.patient_id;
  END IF;

  NEW.organization_id := v_org;
  RETURN NEW;
END;
$$;

-- 2) Triggers
DROP TRIGGER IF EXISTS trg_patient_documents_set_org ON public.patient_documents;
CREATE TRIGGER trg_patient_documents_set_org
BEFORE INSERT OR UPDATE OF patient_id
ON public.patient_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_id_from_patient();

DROP TRIGGER IF EXISTS trg_patient_notes_set_org ON public.patient_notes;
CREATE TRIGGER trg_patient_notes_set_org
BEFORE INSERT OR UPDATE OF patient_id
ON public.patient_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_id_from_patient();

-- 3) Backfill existing rows (data consistency)
UPDATE public.patient_documents d
SET organization_id = p.organization_id
FROM public.patients p
WHERE p.id = d.patient_id
  AND d.organization_id IS DISTINCT FROM p.organization_id;

UPDATE public.patient_notes n
SET organization_id = p.organization_id
FROM public.patients p
WHERE p.id = n.patient_id
  AND n.organization_id IS DISTINCT FROM p.organization_id;

-- 4) Fix INSERT RLS on patient_documents to depend on patient ownership (not client-provided org_id)
DROP POLICY IF EXISTS "Users can insert patient documents" ON public.patient_documents;
CREATE POLICY "Users can insert patient documents" 
ON public.patient_documents
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_documents.patient_id
      AND p.organization_id = get_user_organization(auth.uid())
  )
);
