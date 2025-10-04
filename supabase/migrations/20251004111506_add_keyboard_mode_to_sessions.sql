/*
  # Add keyboard mode option to sessions table

  1. Changes
    - Add `keyboard_mode` column to `sessions` table
      - Type: boolean
      - Default: false (use scrambled letters mode by default)
      - Indicates whether to show full alphabet keyboard or just scrambled letters
  
  2. Notes
    - This allows teachers to choose difficulty level
    - false = easier mode (scrambled letters from the word)
    - true = harder mode (full alphabet keyboard)
    - Enables pedagogical differentiation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'keyboard_mode'
  ) THEN
    ALTER TABLE sessions ADD COLUMN keyboard_mode boolean DEFAULT false;
  END IF;
END $$;