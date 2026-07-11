/*
  # Create dedicated dictee_sessions table

  ## Why
  This project's Supabase database is shared with other PLAI apps. The
  original `sessions` table name collided with a pre-existing table
  belonging to another app (unrelated schema: exercise_id, prenom_eleve,
  reponse, correct, duree_secondes). Every migration that tried to
  `CREATE TABLE IF NOT EXISTS sessions` or `ALTER TABLE sessions ADD
  COLUMN ...` for this app either silently no-op'd or was never applied,
  so this app has never had a working sessions table in production.

  This migration creates a properly namespaced `dictee_sessions` table
  with the full schema this app expects, re-points `student_results`'
  foreign key at it, and leaves the pre-existing `sessions` table (and
  its one row, owned by the other app) completely untouched.

  ## Changes
  1. New table `dictee_sessions` with the complete schema (word list,
     access code, teacher ownership, keyboard/pronunciation/parasite
     letter options, title)
  2. RLS: teachers manage only their own sessions (user_id = auth.uid()),
     students can read a session by access_code without authentication
  3. Storage bucket `word-images` for word-illustration uploads (was
     previously defined only in a migration that never ran)
  4. Re-point `student_results.session_id` foreign key from the
     colliding `sessions` table to `dictee_sessions`
*/

CREATE TABLE IF NOT EXISTS dictee_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Sans titre',
  teacher_name text DEFAULT '',
  word_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  access_code text UNIQUE NOT NULL,
  keyboard_mode boolean DEFAULT false,
  pronunciation_mode boolean DEFAULT false,
  enable_parasite_letters boolean DEFAULT false,
  parasite_letters_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dictee_sessions_user_id ON dictee_sessions(user_id);

ALTER TABLE dictee_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own dictee sessions" ON dictee_sessions;
CREATE POLICY "Teachers can view own dictee sessions"
  ON dictee_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can insert own dictee sessions" ON dictee_sessions;
CREATE POLICY "Teachers can insert own dictee sessions"
  ON dictee_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can update own dictee sessions" ON dictee_sessions;
CREATE POLICY "Teachers can update own dictee sessions"
  ON dictee_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete own dictee sessions" ON dictee_sessions;
CREATE POLICY "Teachers can delete own dictee sessions"
  ON dictee_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Students can find dictee sessions by access code" ON dictee_sessions;
CREATE POLICY "Students can find dictee sessions by access code"
  ON dictee_sessions
  FOR SELECT
  TO anon
  USING (access_code IS NOT NULL);

-- Storage bucket for word images (previously only defined in a migration
-- that never ran against this database)
INSERT INTO storage.buckets (id, name, public)
VALUES ('word-images', 'word-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload word images" ON storage.objects;
CREATE POLICY "Authenticated users can upload word images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'word-images');

DROP POLICY IF EXISTS "Authenticated users can update word images" ON storage.objects;
CREATE POLICY "Authenticated users can update word images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'word-images');

DROP POLICY IF EXISTS "Authenticated users can delete word images" ON storage.objects;
CREATE POLICY "Authenticated users can delete word images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'word-images');

DROP POLICY IF EXISTS "Public read access to word images" ON storage.objects;
CREATE POLICY "Public read access to word images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'word-images');

-- Re-point student_results at the new table. The original FK (from the
-- very first migration, the only sessions-table statement that ever
-- actually ran because student_results didn't previously exist) points
-- at the colliding `sessions` table; move it to `dictee_sessions`.
ALTER TABLE student_results DROP CONSTRAINT IF EXISTS student_results_session_id_fkey;
ALTER TABLE student_results
  ADD CONSTRAINT student_results_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES dictee_sessions(id) ON DELETE CASCADE;
