
-- Super admins için profiles tablosuna UPDATE policy ekle
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins için profiles tablosuna INSERT policy ekle (gerekirse)
CREATE POLICY "Super admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
