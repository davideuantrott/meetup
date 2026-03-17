-- Migration 003: avatar URLs + image fields + Supabase Storage bucket

-- Add avatar_url to users (populated from Google OAuth photo)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add image_url to groups and meetups (user-uploaded photos)
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.meetups
  ADD COLUMN IF NOT EXISTS image_url text;

-- ============================================================
-- Storage bucket: images
-- Create this bucket in the Supabase dashboard:
--   Storage → New bucket → name: "images" → Public: ON
-- Then add these policies in the SQL editor:
-- ============================================================

-- Allow authenticated users to upload to their own folder
-- (path pattern: {userId}/{filename})
-- CREATE POLICY "images_insert_auth" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow everyone to read images (public bucket)
-- CREATE POLICY "images_select_public" ON storage.objects FOR SELECT
--   USING (bucket_id = 'images');

-- Allow users to update/delete their own uploads
-- CREATE POLICY "images_update_own" ON storage.objects FOR UPDATE
--   USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "images_delete_own" ON storage.objects FOR DELETE
--   USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
