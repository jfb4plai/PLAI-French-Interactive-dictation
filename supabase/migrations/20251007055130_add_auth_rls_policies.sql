/*
  # Add Authentication-based RLS Policies

  ## Security Configuration
  
  1. Teacher Policies (authenticated users)
    - INSERT: Can only create sessions with their own user_id
    - SELECT: Can only view their own sessions
    - UPDATE: Can only update their own sessions
    - DELETE: Can only delete their own sessions
  
  2. Student Policies (anonymous users)
    - SELECT: Can find sessions by access_code to join games
  
  3. Important Notes
    - Teachers must be authenticated to manage sessions
    - Students access sessions via access_code without authentication
    - Each teacher can only see and manage their own sessions
*/

-- Create restrictive policies for teachers (authenticated users)
CREATE POLICY "Teachers can insert own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can view own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can update own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can delete own sessions"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow students (anonymous users) to find sessions by access code
CREATE POLICY "Students can find sessions by access code"
  ON sessions
  FOR SELECT
  TO anon
  USING (access_code IS NOT NULL);
