-- Add image_url column to posts (used by image uploads in ComposeBox + comments).
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url text;

-- Refresh PostgREST schema cache so the API picks up the new column right away.
NOTIFY pgrst, 'reload schema';
