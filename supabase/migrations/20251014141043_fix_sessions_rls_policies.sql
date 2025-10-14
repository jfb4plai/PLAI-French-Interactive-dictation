/*
  # Fix Sessions RLS Policies

  1. Changes
    - Remove overly permissive "Anyone can read sessions with access code" policy
    - Remove overly permissive "Anyone can create sessions" policy
    - Keep only the proper authenticated teacher policies
    - Keep the anonymous student policy for finding sessions by access code
    
  2. Security Notes
    - Teachers (authenticated) can only see/manage their own sessions
    - Students (anonymous) can only find sessions by access code
    - This prevents teachers from seeing other teachers' sessions
*/

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can read sessions with access code" ON sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON sessions;