-- Insert patients with meeting-like data into marketer_meetings
INSERT INTO public.marketer_meetings (organization_id, contact_name, business_name, business_type, meeting_date, result, phone, created_at)
SELECT 
  p.organization_id,
  p.first_name AS contact_name,  -- business name was stored in first_name
  p.first_name AS business_name,
  'hairdresser' AS business_type,
  COALESCE(p.created_at, now()) AS meeting_date,
  CASE p.last_name
    WHEN 'AA' THEN 'positive'::meeting_result
    WHEN 'A/B' THEN 'positive'::meeting_result
    WHEN 'B' THEN 'follow_up'::meeting_result
    WHEN 'B/C' THEN 'pending'::meeting_result
    WHEN 'C' THEN 'negative'::meeting_result
  END AS result,
  p.phone,
  COALESCE(p.created_at, now()) AS created_at
FROM public.patients p
WHERE p.last_name IN ('AA', 'B', 'B/C', 'A/B', 'C')
  AND p.organization_id = '5914deac-c4ac-40be-a95c-cff166d5dc76';

-- Delete these patients after migration
DELETE FROM public.patients
WHERE last_name IN ('AA', 'B', 'B/C', 'A/B', 'C')
  AND organization_id = '5914deac-c4ac-40be-a95c-cff166d5dc76';