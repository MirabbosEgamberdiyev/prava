-- Add is_demo column to questions table for separating guest/demo questions from main question bank
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast lookup of active demo questions
CREATE INDEX IF NOT EXISTS idx_question_is_demo ON questions(is_demo) WHERE deleted = false AND is_active = true;

-- Seed first 25 active questions as demo questions if no demo questions exist
UPDATE questions
SET is_demo = TRUE
WHERE id IN (
    SELECT id FROM questions
    WHERE deleted = false AND is_active = true
    ORDER BY id ASC
    LIMIT 25
);
