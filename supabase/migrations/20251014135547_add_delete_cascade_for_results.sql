/*
  # Add DELETE policy for student_results

  1. Changes
    - Add DELETE policy for student_results table
      - Allows anyone (including authenticated teachers) to delete results
      - This is necessary when a teacher deletes a session and its associated results
    
  2. Security Notes
    - The policy allows deletion which is required for the cascade delete functionality
    - Teachers need to be able to delete results when they delete their sessions
*/

-- Add delete policy for student_results
CREATE POLICY "Anyone can delete student results"
  ON student_results
  FOR DELETE
  USING (true);