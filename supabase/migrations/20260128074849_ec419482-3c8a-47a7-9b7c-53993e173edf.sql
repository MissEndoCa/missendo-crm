-- Insert 5 static leads from ads
INSERT INTO leads (first_name, last_name, phone, email, country, source, organization_id, status, assigned_by_missendo) VALUES 
('Ahmet', 'Yılmaz', '+905551234567', 'ahmet.yilmaz@email.com', 'Turkey', 'Facebook Ads', '58361832-c79f-40b3-a6f8-2b61db12de5f', 'new', true),
('Fatma', 'Kaya', '+905552345678', 'fatma.kaya@email.com', 'Germany', 'Google Ads', '58361832-c79f-40b3-a6f8-2b61db12de5f', 'contacted', true),
('Mehmet', 'Demir', '+905553456789', 'mehmet.demir@email.com', 'Netherlands', 'Instagram Ads', '5e4acb0e-c66a-4ef7-bdb0-b4ebe0458f76', 'new', true),
('Ayşe', 'Öztürk', '+905554567890', 'ayse.ozturk@email.com', 'UK', 'Facebook Ads', '5e4acb0e-c66a-4ef7-bdb0-b4ebe0458f76', 'appointment_scheduled', true),
('Ali', 'Çelik', '+905555678901', 'ali.celik@email.com', 'France', 'Google Ads', '067eba49-384f-43d9-a629-2d6c3afa60a5', 'new', true);