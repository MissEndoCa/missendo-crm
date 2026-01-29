-- Fix patient_documents INSERT policy - the organization_id in the document must match the patient's organization
DROP POLICY IF EXISTS "Users can insert patient documents for their organization" ON patient_documents;

-- Allow insert if: user belongs to the same org as the patient OR user is super_admin
CREATE POLICY "Users can insert patient documents" 
ON patient_documents FOR INSERT 
WITH CHECK (
  -- The document's organization_id must match the patient's organization_id
  organization_id = (SELECT organization_id FROM patients WHERE id = patient_id)
  AND (
    -- User is from the same organization as the patient
    (SELECT organization_id FROM patients WHERE id = patient_id) = get_user_organization(auth.uid())
    OR
    -- User is super_admin
    has_role(auth.uid(), 'super_admin')
  )
);

-- Also fix the SELECT, UPDATE, DELETE to include super_admin check
DROP POLICY IF EXISTS "Users can view patient documents for their organization" ON patient_documents;
CREATE POLICY "Users can view patient documents" 
ON patient_documents FOR SELECT 
USING (
  organization_id = get_user_organization(auth.uid())
  OR has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Users can update patient documents for their organization" ON patient_documents;
DROP POLICY IF EXISTS "Super admins can update patient documents" ON patient_documents;
CREATE POLICY "Users can update patient documents" 
ON patient_documents FOR UPDATE 
USING (
  organization_id = get_user_organization(auth.uid())
  OR has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Users can delete patient documents for their organization" ON patient_documents;
CREATE POLICY "Users can delete patient documents" 
ON patient_documents FOR DELETE 
USING (
  organization_id = get_user_organization(auth.uid())
  OR has_role(auth.uid(), 'super_admin')
);

-- Drop redundant super admin policies (now included in main policies)
DROP POLICY IF EXISTS "Super admins can view all patient documents" ON patient_documents;