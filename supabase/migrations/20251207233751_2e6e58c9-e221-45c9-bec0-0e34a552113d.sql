-- Drop the existing ALL policy and create separate policies for better control
DROP POLICY IF EXISTS "Users can manage their organization's patients" ON public.patients;

-- SELECT policies already exist for super_admin and org users

-- INSERT policy for organization users
CREATE POLICY "Users can insert patients for their organization"
ON public.patients FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

-- INSERT policy for super admins
CREATE POLICY "Super admins can insert any patient"
ON public.patients FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- UPDATE policy for organization users
CREATE POLICY "Users can update their organization's patients"
ON public.patients FOR UPDATE
USING (organization_id = get_user_organization(auth.uid()));

-- UPDATE policy for super admins
CREATE POLICY "Super admins can update any patient"
ON public.patients FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'));

-- DELETE policy for organization users
CREATE POLICY "Users can delete their organization's patients"
ON public.patients FOR DELETE
USING (organization_id = get_user_organization(auth.uid()));

-- DELETE policy for super admins
CREATE POLICY "Super admins can delete any patient"
ON public.patients FOR DELETE
USING (has_role(auth.uid(), 'super_admin'));