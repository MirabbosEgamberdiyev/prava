-- check-answer orqali tekshirilgan javoblar qulflanadi (audit: "secure" imtihonda javoblarni
-- oldindan sinab ko'rib, keyin to'g'risini yuborishning oldini olish).
ALTER TABLE exam_answers ADD COLUMN IF NOT EXISTS answer_locked BOOLEAN NOT NULL DEFAULT FALSE;
