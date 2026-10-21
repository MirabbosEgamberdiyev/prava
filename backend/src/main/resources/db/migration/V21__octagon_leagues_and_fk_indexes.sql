-- =====================================================================
-- Migration V21 (2026-10-21)
--   1. Oktagon ligalari 4 → 6: Bronza, Kumush, Oltin, Platina (300+), Olmos (500+), Master (800+).
--   2. Xorijiy kalit (FK) ustunlari uchun indekslar Flyway'ga ko'chirildi — ddl-auto: validate ga
--      o'tilganda Hibernate ularni endi yaratmaydi.
-- Jadval mavjud bo'lmagan (bo'sh) bazada ham xatosiz ishlaydi.
-- =====================================================================

DO $$
BEGIN
    IF to_regclass('public.octagon_profiles') IS NOT NULL THEN
        -- Hibernate @Enumerated jadvalni o'zi yaratgan bo'lsa, eski 4 qiymatli CHECK cheklovi
        -- yangi PLATINUM/MASTER qiymatlarini rad etadi.
        ALTER TABLE octagon_profiles DROP CONSTRAINT IF EXISTS octagon_profiles_rank_check;

        UPDATE octagon_profiles SET rank = CASE
            WHEN elo_rating >= 800 THEN 'MASTER'
            WHEN elo_rating >= 500 THEN 'BRILLIANT'
            WHEN elo_rating >= 300 THEN 'PLATINUM'
            WHEN elo_rating >= 150 THEN 'GOLD'
            WHEN elo_rating >= 50  THEN 'SILVER'
            ELSE 'BRONZE'
        END;
    END IF;

    IF to_regclass('public.exam_sessions') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_session_user ON exam_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_session_package ON exam_sessions(package_id);
        CREATE INDEX IF NOT EXISTS idx_session_ticket ON exam_sessions(ticket_id);
    END IF;

    IF to_regclass('public.exam_answers') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_answer_session ON exam_answers(exam_session_id);
        CREATE INDEX IF NOT EXISTS idx_answer_question ON exam_answers(question_id);
    END IF;

    IF to_regclass('public.user_wrong_answers') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_uwa_user ON user_wrong_answers(user_id);
        CREATE INDEX IF NOT EXISTS idx_uwa_question ON user_wrong_answers(question_id);
    END IF;

    IF to_regclass('public.user_saved_questions') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_usq_user ON user_saved_questions(user_id);
        CREATE INDEX IF NOT EXISTS idx_usq_question ON user_saved_questions(question_id);
    END IF;

    IF to_regclass('public.octagon_matches') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_octagon_matches_p1 ON octagon_matches(player1_id);
        CREATE INDEX IF NOT EXISTS idx_octagon_matches_p2 ON octagon_matches(player2_id);
    END IF;

    IF to_regclass('public.octagon_challenges') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_octagon_challenges_challenger ON octagon_challenges(challenger_id);
    END IF;

    IF to_regclass('public.octagon_reports') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_octagon_reports_reporter ON octagon_reports(reporter_id);
    END IF;
END $$;
