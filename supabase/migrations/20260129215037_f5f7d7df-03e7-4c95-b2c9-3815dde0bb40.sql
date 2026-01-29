-- Create storage policies for email-assets bucket (if not exists, they may need update)
-- Allow authenticated users to upload to email-assets bucket
CREATE POLICY "Authenticated users can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');

-- Allow authenticated users to view email-assets
CREATE POLICY "Anyone can view email assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Allow authenticated users to update their email assets
CREATE POLICY "Authenticated users can update email assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'email-assets');

-- Allow authenticated users to delete email assets
CREATE POLICY "Authenticated users can delete email assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets');