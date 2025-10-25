-- Create Miss Endo LLC organization
INSERT INTO public.organizations (name, email, phone, country, is_active)
VALUES ('Miss Endo LLC', 'info@missendo.com', '+90 555 123 4567', 'Turkey', true);

-- Get the organization ID and update user
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := 'ca96676b-8d71-4951-99ac-b8b1e0e10e65';
BEGIN
  -- Get the newly created organization ID
  SELECT id INTO v_org_id FROM public.organizations WHERE email = 'info@missendo.com';
  
  -- Update profile to link to organization
  UPDATE public.profiles 
  SET organization_id = v_org_id
  WHERE id = v_user_id;
  
  -- Make user super admin
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (v_user_id, 'super_admin', v_org_id)
  ON CONFLICT (user_id, role, organization_id) DO NOTHING;
  
  -- Also make them admin of Miss Endo organization
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (v_user_id, 'clinic_admin', v_org_id)
  ON CONFLICT (user_id, role, organization_id) DO NOTHING;
END $$;