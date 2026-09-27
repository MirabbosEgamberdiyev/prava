-- B-20/B-03: imtihon rejimi (REAL, TICKET, MARATHON, SURVIVAL, TOPIC, PACKAGE) — baholash qoidasini tanlaydi.
-- NULL — eski sessiyalar va rejim yubormaydigan klientlar (legacy baholash: bilet/paketdan aniqlanadi).
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS exam_mode VARCHAR(20);
