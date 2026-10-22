-- V23: Oktagon do'st taklifi kodi 4 raqamli (1000–9999) bo'ldi.
--
-- 9000 ta kod butun tarix bo'yicha unikal bo'la olmaydi, shuning uchun:
--   * invite_code ustunidagi barcha (to'liq) UNIQUE cheklov/indekslar olib tashlanadi — V18 dagi
--     "invite_code ... UNIQUE" (octagon_challenges_invite_code_key) va Hibernate yaratgan unikal
--     idx_octagon_challenges_code ham;
--   * qidiruv uchun oddiy indeks qoladi;
--   * unikallik faqat faol (PENDING) takliflar orasida — qisman unikal indeks. Ilova kod tanlashda band
--     kodni tashlab ketadi, bir vaqtdagi to'qnashuvni shu indeks ushlaydi.
--
-- Hozirgi PENDING takliflarning 10 belgili kodlari allaqachon unikal, indeks muammosiz yaratiladi.

DO $$
DECLARE
    r RECORD;
BEGIN
    IF to_regclass('public.octagon_challenges') IS NULL THEN
        RETURN;
    END IF;

    FOR r IN
        SELECT con.conname
          FROM pg_constraint con
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
         WHERE con.conrelid = 'public.octagon_challenges'::regclass
           AND con.contype = 'u'
           AND array_length(con.conkey, 1) = 1
           AND att.attname = 'invite_code'
    LOOP
        EXECUTE format('ALTER TABLE public.octagon_challenges DROP CONSTRAINT %I', r.conname);
    END LOOP;

    FOR r IN
        SELECT idx.relname
          FROM pg_index ix
          JOIN pg_class idx ON idx.oid = ix.indexrelid
          JOIN pg_attribute att ON att.attrelid = ix.indrelid AND att.attnum = ANY (ix.indkey)
         WHERE ix.indrelid = 'public.octagon_challenges'::regclass
           AND ix.indisunique
           AND NOT ix.indisprimary
           AND ix.indnatts = 1
           AND ix.indpred IS NULL
           AND att.attname = 'invite_code'
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', r.relname);
    END LOOP;

    CREATE INDEX IF NOT EXISTS idx_octagon_challenges_code ON octagon_challenges (invite_code);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_octagon_challenges_pending_code
        ON octagon_challenges (invite_code)
        WHERE status = 'PENDING';
END $$;
