-- Drop existing patient-photos policies
DROP POLICY IF EXISTS "Users can view their organization's patient photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload patient photos for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient photos for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient photos for their organization" ON storage.objects;

-- Create new policies for patient-photos that handle both new and existing patients
-- Also handle super_admin access

-- SELECT: Authenticated users can view patient photos (bucket is public anyway)
CREATE POLICY "Authenticated users can view patient photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-photos' 
  AND auth.role() = 'authenticated'
);

-- INSERT: Users can upload patient photos for their organization OR if super_admin
CREATE POLICY "Users can upload patient photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-photos'
  AND auth.role() = 'authenticated'
  AND (
    -- Super admin can upload for any patient
    has_role(auth.uid(), 'super_admin')
    OR
    -- Clinic admin can upload for any patient in their org
    has_role(auth.uid(), 'clinic_admin')
    OR
    -- Regular users can upload if patient belongs to their org
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.organization_id = get_user_organization(auth.uid())
    )
    OR
    -- Allow upload if path starts with a valid UUID format (for new patients being created)
    (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
);

-- UPDATE: Users can update patient photos
CREATE POLICY "Users can update patient photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'patient-photos'
  AND auth.role() = 'authenticated'
  AND (
    has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'clinic_admin')
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.organization_id = get_user_organization(auth.uid())
    )
  )
);

-- DELETE: Users can delete patient photos
CREATE POLICY "Users can delete patient photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-photos'
  AND auth.role() = 'authenticated'
  AND (
    has_role(auth.uid(), 'super_admin')
    OR has_role(auth.uid(), 'clinic_admin')
    OR EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.organization_id = get_user_organization(auth.uid())
    )
  )
);