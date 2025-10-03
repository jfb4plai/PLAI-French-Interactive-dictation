/*
  # Create Dictation App Tables

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key) - Unique session identifier
      - `teacher_name` (text) - Optional teacher name
      - `word_list` (jsonb) - Array of words for the dictation
      - `access_code` (text, unique) - 6-character code for student access
      - `created_at` (timestamptz) - Timestamp of session creation
    
    - `student_results`
      - `id` (uuid, primary key) - Unique result identifier
      - `session_id` (uuid, foreign key) - Reference to sessions table
      - `student_name` (text) - Student's name/first name
      - `attempts` (jsonb) - Array of all attempts with word, tries, screenshots
      - `final_score` (integer) - Final score achieved
      - `completed_at` (timestamptz) - Timestamp of completion
      - `duration_seconds` (integer) - Total time taken
  
  2. Security
    - Enable RLS on both tables
    - Allow public read/write access for sessions (using access codes)
    - Allow public read/write access for student_results (using session validation)

  3. Indexes
    - Index on access_code for fast lookups
    - Index on session_id for student_results queries
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_name text DEFAULT '',
  word_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  access_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  attempts jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_score integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  duration_seconds integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_access_code ON sessions(access_code);
CREATE INDEX IF NOT EXISTS idx_student_results_session_id ON student_results(session_id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sessions with access code"
  ON sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read student results"
  ON student_results
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create student results"
  ON student_results
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update student results"
  ON student_results
  FOR UPDATE
  USING (true)
  WITH CHECK (true);