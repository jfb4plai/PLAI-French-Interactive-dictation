/*
  # Add title field to sessions table

  1. Changes
    - Add `title` column to `sessions` table
      - Type: text
      - Required: NOT NULL
      - Description: Mandatory title for each dictation session to help teachers organize and find their sessions
    
  2. Notes
    - Title is mandatory to improve session management
    - Existing sessions will need a default title value during migration
    - This helps teachers avoid accumulating unidentifiable old sessions
*/

-- Add title column with a default value for existing rows
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Sans titre';

-- Remove the default after adding the column (new rows must provide a title)
ALTER TABLE sessions 
ALTER COLUMN title DROP DEFAULT;