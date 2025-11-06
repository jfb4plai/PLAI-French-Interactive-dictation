/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add index on sessions.user_id foreign key for better query performance
    - Optimize RLS policies to use (SELECT auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth.uid() for each row at scale
    
  2. Index Cleanup
    - Remove unused idx_sessions_access_code index
    
  3. Changes Made
    - Create index on user_id column
    - Drop and recreate all teacher RLS policies with optimized auth calls
    - Remove unused access_code index

  Note: Leaked Password Protection must be enabled via Supabase Dashboard > Authentication > Policies
*/

-- Add index on foreign key for better join performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Drop unused access_code index
DROP INDEX IF EXISTS idx_sessions_access_code;

-- Drop existing teacher policies
DROP POLICY IF EXISTS "Teachers can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Teachers can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Teachers can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Teachers can delete own sessions" ON sessions;

-- Recreate policies with optimized auth.uid() calls
CREATE POLICY "Teachers can view own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can insert own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can delete own sessions"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));