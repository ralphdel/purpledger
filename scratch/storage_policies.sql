-- 1. Create the storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('merchant_logos', 'merchant_logos', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view the logos
CREATE POLICY "Public Access to Logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'merchant_logos');

-- 3. Allow authenticated users to upload logos
CREATE POLICY "Auth Users can upload logos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'merchant_logos');

-- 4. Allow authenticated users to update logos
CREATE POLICY "Auth Users can update logos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'merchant_logos');

-- 5. Allow authenticated users to delete logos
CREATE POLICY "Auth Users can delete logos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'merchant_logos');
