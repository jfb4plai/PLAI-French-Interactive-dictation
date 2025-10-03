import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Session {
  id: string;
  teacher_name: string;
  word_list: string[];
  access_code: string;
  created_at: string;
}

export interface WordAttempt {
  word: string;
  correct_word: string;
  attempt_number: number;
  is_correct: boolean;
  screenshot?: string;
  points: number;
}

export interface StudentResult {
  id: string;
  session_id: string;
  student_name: string;
  attempts: WordAttempt[];
  final_score: number;
  completed_at: string;
  duration_seconds: number;
}
