/*
  # Add challenge mode tracking to student results

  1. Changes
    - Add `challenge_mode` column to `student_results` table
      - Type: boolean
      - Default: false
      - Indicates if the student completed this attempt in keyboard mode (full alphabet)
  
  2. Notes
    - This allows teachers to see which attempts were done in easy mode vs challenge mode
    - Students can have multiple results: one in easy mode + one in challenge mode
    - Helps track student progression and differentiation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_results' AND column_name = 'challenge_mode'
  ) THEN
    ALTER TABLE student_results ADD COLUMN challenge_mode boolean DEFAULT false;
  END IF;
END $$;