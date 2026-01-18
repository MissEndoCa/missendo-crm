-- Remove clinic_admin role from info@talxmedia.com.tr (keeping only super_admin)
DELETE FROM public.user_roles 
WHERE id = '0f4a882c-2b3f-46a9-85d1-248a1887c659';