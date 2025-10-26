
-- Update Talha Öztürk's organization to Talx Media LLC
UPDATE organizations 
SET name = 'Talx Media LLC', 
    email = 'info@talxmedia.com.tr'
WHERE id = '5af52bad-7065-401c-a5a7-57edb73c5cce';

-- Update Miss Endo LLC with correct information
UPDATE organizations 
SET email = 'info@missendo.com',
    phone = '+1(310)628-7442',
    address = '9440 Santa Monica Blvd, Suite 301',
    city = 'Beverly Hills',
    country = 'USA'
WHERE id = '1a4b5fa6-afa4-4843-a11a-d02cfbfa97f3';
