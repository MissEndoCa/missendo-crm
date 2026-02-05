-- First delete the patients created from test leads
DELETE FROM patients 
WHERE id IN (
  '97492b74-3a28-4064-8329-d39c0d1e5dcb',
  '9a934817-31b9-46f1-b0be-b83bd4b0ee00',
  'cdac6e11-d5f7-4c1d-811a-41e72901b449',
  '0bcc689d-c96f-47dc-9a68-78e9764b446c'
);

-- Then delete the leads (including the contacted one)
DELETE FROM leads
WHERE id IN (
  'd34f4faf-2fc5-43b3-9ea9-db83454ed9b9',
  'ec2c9524-2f9e-4fac-a9df-0d6c3aba259a',
  'ea1784e3-316b-4af5-8aaf-43351c2179f6',
  '06223b0a-0e68-4772-99c9-abaca09e5d89',
  '0a55ab4e-4fda-4806-934f-b83bde1973da'
);