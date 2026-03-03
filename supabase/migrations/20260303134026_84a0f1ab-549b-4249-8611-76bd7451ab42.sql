
-- Move "Maryam Salon AA" from leads to marketer_meetings
INSERT INTO public.marketer_meetings (
  business_name,
  contact_name,
  business_type,
  phone,
  address,
  city,
  notes,
  meeting_date,
  result,
  organization_id,
  created_by
) VALUES (
  'Maryam Salon',
  'AA',
  'hairdresser',
  '949-293-8774',
  'culver dr irvine',
  'Irvine',
  'Maryam ile gorusuldu. Iranli kadin, musterisinin bu yaz TRye gidecegini ve hairtransplant ihtiyaci oldugunu soyledi. arayi sicak tutalim',
  '2026-03-02T22:36:31+00:00',
  'follow_up',
  '5914deac-c4ac-40be-a95c-cff166d5dc76',
  '4e757bc1-6650-4091-b955-e012f4359df1'
);

-- Delete the lead record
DELETE FROM public.leads WHERE id = '01f61f4a-615f-497f-abfa-7c60a0ca0278';
