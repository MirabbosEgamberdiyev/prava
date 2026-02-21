-- Make question fields nullable for optional question creation
ALTER TABLE questions ALTER COLUMN text_uzl DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN correct_answer_index DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN difficulty DROP NOT NULL;

-- Make question option fields nullable
ALTER TABLE question_options ALTER COLUMN text_uzl DROP NOT NULL;
ALTER TABLE question_options ALTER COLUMN option_index DROP NOT NULL;
