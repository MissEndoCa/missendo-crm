-- Move patients with last_name 'A' to meetings
INSERT INTO public.marketer_meetings (organization_id, contact_name, business_name, business_type, meeting_date, result, phone, created_at)
SELECT 
  p.organization_id,
  p.first_name,
  p.first_name,
  'hairdresser',
  COALESCE(p.created_at, now()),
  'positive'::meeting_result,
  p.phone,
  COALESCE(p.created_at, now())
FROM public.patients p
WHERE p.last_name = 'A'
  AND p.organization_id = '5914deac-c4ac-40be-a95c-cff166d5dc76';

-- Delete them from patients
DELETE FROM public.patients
WHERE last_name = 'A'
  AND organization_id = '5914deac-c4ac-40be-a95c-cff166d5dc76';