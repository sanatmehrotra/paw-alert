-- Add image_url to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for animal photos if it doesn't exist
-- Note: inserting directly into storage.buckets is the standard SQL way in Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-photos', 'animal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Allow public uploads
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'animal-photos');

-- Allow public reads
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
USING (bucket_id = 'animal-photos');
