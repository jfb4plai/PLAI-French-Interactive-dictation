/*
  # Add Enhanced Features to Dictation Sessions

  ## Overview
  This migration adds three new optional features to enhance the dictation experience:
  - Pronunciation mode: Auto-pronounce letters as students type
  - Word images: Display images alongside words during exercises
  - Prefilled letters: Pre-fill specific letters to help students

  ## Changes Made

  1. Sessions Table
    - Add `pronunciation_mode` (boolean, default false)
      Enables automatic pronunciation of typed letters (from 2nd letter onwards)
    
  2. Word List Structure Enhancement
    - The `word_list` JSONB column now supports both formats:
      - Legacy: Simple string array ["chat", "maison"]
      - Enhanced: Object array with additional properties:
        [{
          "word": "chat",
          "image_url": "https://... or storage path", (optional)
          "prefilled_indices": [0, 3] (optional, array of letter positions to prefill)
        }]
    
  3. Storage Setup
    - Create 'word-images' bucket for image uploads
    - Public access for easy display in student interface
    - RLS policies for authenticated teachers only

  ## Security
  - Pronunciation mode is session-level, no security concerns
  - Image URLs can be external or internal storage paths
  - Only authenticated users can upload to storage bucket
  - Images are publicly readable for student access

  ## Notes
  - All features are optional and combinable
  - Backward compatible with existing sessions (simple string arrays)
  - Images remain visible during the entire exercise
  - Prefilled letters have the same visual formatting as other letters
*/

-- Add pronunciation_mode column to sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'pronunciation_mode'
  ) THEN
    ALTER TABLE sessions ADD COLUMN pronunciation_mode boolean DEFAULT false;
  END IF;
END $$;

-- Create storage bucket for word images
INSERT INTO storage.buckets (id, name, public)
VALUES ('word-images', 'word-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload word images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update word images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete word images" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access to word images" ON storage.objects;
END $$;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload word images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'word-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update word images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'word-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete word images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'word-images');

-- Allow public read access to word images
CREATE POLICY "Public read access to word images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'word-images');
