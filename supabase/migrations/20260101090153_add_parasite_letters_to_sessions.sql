/*
  # Add parasite letters feature to sessions

  1. Changes to `sessions` table
    - Add `enable_parasite_letters` (boolean) - Controls if parasite letters feature is enabled for this session
    - Add `parasite_letters_count` (integer) - Number of parasite letters to add (1, 2, or 3)
    
  2. Notes
    - Parasite letters are stored in the words JSON array for each word
    - The parasite letters count determines how many extra letters are shown
    - This feature is automatically disabled if full alphabetic keyboard mode is active
    - Default values: enable_parasite_letters = false, parasite_letters_count = 1
*/

-- Add parasite letters configuration to sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'enable_parasite_letters'
  ) THEN
    ALTER TABLE sessions ADD COLUMN enable_parasite_letters boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'parasite_letters_count'
  ) THEN
    ALTER TABLE sessions ADD COLUMN parasite_letters_count integer DEFAULT 1;
  END IF;
END $$;