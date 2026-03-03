UPDATE public.leads 
SET first_name = 'Jean', last_name = 'Cano', phone = '+33762174686', email = 'jeancano235@gmail.com'
WHERE notes LIKE '%1960792558123660%' AND first_name = 'Unknown';