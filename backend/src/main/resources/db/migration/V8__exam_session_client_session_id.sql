-- Offline imtihon natijalari idempotent bo'lishi uchun (audit P1-M3).
-- Mobil klient javob yo'qolganda qayta yuboradi — bir xil natija ikki marta yozilmasin.
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS client_session_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS ux_exam_sessions_user_client_session
    ON exam_sessions (user_id, client_session_id)
    WHERE client_session_id IS NOT NULL;
