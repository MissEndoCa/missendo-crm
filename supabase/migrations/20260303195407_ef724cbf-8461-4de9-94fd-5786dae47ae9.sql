-- First remove lead_id references from patients
UPDATE public.patients SET lead_id = NULL
WHERE lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id = '7da6c357-4a9c-4423-aabe-a986cc4bfc2b' 
    AND source IN ('Facebook Lead Ads', 'facebook_ads')
    AND notes NOT LIKE '%Ad ID: 120241180409270463%'
);

-- Also remove lead_id references from appointments
UPDATE public.appointments SET lead_id = NULL
WHERE lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id = '7da6c357-4a9c-4423-aabe-a986cc4bfc2b' 
    AND source IN ('Facebook Lead Ads', 'facebook_ads')
    AND notes NOT LIKE '%Ad ID: 120241180409270463%'
);

-- Remove from lead_group_members
DELETE FROM public.lead_group_members
WHERE lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id = '7da6c357-4a9c-4423-aabe-a986cc4bfc2b' 
    AND source IN ('Facebook Lead Ads', 'facebook_ads')
    AND notes NOT LIKE '%Ad ID: 120241180409270463%'
);

-- Remove reminders referencing these leads
UPDATE public.reminders SET lead_id = NULL
WHERE lead_id IN (
  SELECT id FROM public.leads 
  WHERE organization_id = '7da6c357-4a9c-4423-aabe-a986cc4bfc2b' 
    AND source IN ('Facebook Lead Ads', 'facebook_ads')
    AND notes NOT LIKE '%Ad ID: 120241180409270463%'
);

-- Now delete the leads
DELETE FROM public.leads 
WHERE organization_id = '7da6c357-4a9c-4423-aabe-a986cc4bfc2b' 
  AND source IN ('Facebook Lead Ads', 'facebook_ads')
  AND notes NOT LIKE '%Ad ID: 120241180409270463%';