/*
  # Add user_id column to sessions table

  ## Changes Made
  
  1. Schema Changes
    - Add `user_id` column to `sessions` table (references auth.users)
    - Existing sessions will have NULL user_id
  
  2. Security Updates
    - Drop existing RLS policies (they will be recreated in next migration)
*/

-- Drop existing policies on sessions table first
DROP POLICY IF EXISTS "Anyone can read sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON sessions;

-- Add user_id column to sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
