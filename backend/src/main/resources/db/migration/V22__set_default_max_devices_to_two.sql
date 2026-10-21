-- V22: Bir akkaunt uchun standart qurilma limiti 4 → 2 (hamkor talabi).
--
-- 1. Ustun standarti 2 ga o'zgaradi (yangi foydalanuvchilar).
-- 2. Limiti alohida o'rnatilmagan (device_limit_customized = false/NULL) foydalanuvchilar 2 ga tushiriladi;
--    admin alohida bergan limitlar o'zgarmaydi.
-- 3. Shu foydalanuvchilarning limitdan ortiq faol sessiyalari bekor qilinadi: eng so'nggi faol 2 ta qurilma
--    (oxirgi foydalanish vaqti bo'yicha) qoladi, qolganlari keyingi so'rovda qayta kirishni so'raydi.
--
-- Hibernate yaratgan sxemalarda ham ishlashi uchun jadvallar to_regclass bilan tekshiriladi; qayta ishga
-- tushirilsa hech narsa buzilmaydi (idempotent).

DO $$
BEGIN
    IF to_regclass('public.users') IS NULL THEN
        RETURN;
    END IF;

    ALTER TABLE users ALTER COLUMN max_devices SET DEFAULT 2;

    UPDATE users
       SET max_devices = 2
     WHERE (device_limit_customized = FALSE OR device_limit_customized IS NULL)
       AND (max_devices IS NULL OR max_devices > 2);

    IF to_regclass('public.refresh_tokens') IS NOT NULL THEN
        UPDATE refresh_tokens rt
           SET is_revoked = TRUE,
               revoked_at = LOCALTIMESTAMP
          FROM (
                SELECT ranked.token_family
                  FROM (
                        SELECT t.user_id,
                               t.token_family,
                               ROW_NUMBER() OVER (
                                   PARTITION BY t.user_id
                                   ORDER BY MAX(COALESCE(t.last_used_at, t.created_at)) DESC
                               ) AS rn
                          FROM refresh_tokens t
                          JOIN users u ON u.id = t.user_id
                         WHERE t.is_revoked = FALSE
                           AND t.expires_at > LOCALTIMESTAMP
                           AND (u.device_limit_customized = FALSE OR u.device_limit_customized IS NULL)
                         GROUP BY t.user_id, t.token_family
                       ) ranked
                  JOIN users u2 ON u2.id = ranked.user_id
                 WHERE ranked.rn > COALESCE(u2.max_devices, 2)
               ) excess
         WHERE rt.token_family = excess.token_family
           AND rt.is_revoked = FALSE;

        -- Eski hisoblagich (faqat ma'lumot uchun) haqiqiy faol qurilmalar soniga tenglashtiriladi
        UPDATE users u
           SET active_device_count = COALESCE(a.cnt, 0)
          FROM (
                SELECT u3.id AS user_id, COUNT(DISTINCT t.token_family) AS cnt
                  FROM users u3
                  LEFT JOIN refresh_tokens t
                         ON t.user_id = u3.id AND t.is_revoked = FALSE AND t.expires_at > LOCALTIMESTAMP
                 WHERE (u3.device_limit_customized = FALSE OR u3.device_limit_customized IS NULL)
                 GROUP BY u3.id
               ) a
         WHERE u.id = a.user_id
           AND u.active_device_count IS DISTINCT FROM COALESCE(a.cnt, 0);
    END IF;
END $$;
