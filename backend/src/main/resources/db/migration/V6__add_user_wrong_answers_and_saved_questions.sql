-- V6: Xato javoblar va saqlangan savollar jadvallari
-- Prava-Desktop-Online va Web uchun

CREATE TABLE IF NOT EXISTS user_wrong_answers (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id     BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    wrong_count     INTEGER NOT NULL DEFAULT 1,
    last_seen       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_uwa_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_uwa_user ON user_wrong_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_uwa_question ON user_wrong_answers(question_id);

CREATE TABLE IF NOT EXISTS user_saved_questions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id     BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    saved_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usq_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_usq_user ON user_saved_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_usq_question ON user_saved_questions(question_id);
