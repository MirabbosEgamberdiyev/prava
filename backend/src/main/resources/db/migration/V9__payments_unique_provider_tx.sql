-- Bitta provayder tranzaksiyasi (Click/Payme ID) faqat bitta to'lov yozuviga tegishli bo'lishi kerak
-- (audit P2-B9). Parallel webhook'lar ikki marta to'lov yaratmasligi uchun DB darajasida kafolat.
--
-- Mavjud dublikatlar bo'lsa, indeks YARATILMAYDI va migratsiya yiqilmaydi (deploy to'xtamasin) —
-- WARNING log'ga yoziladi. Dublikatlarni qo'lda tozalab, keyingi migratsiyada indeksni qo'shing:
--   SELECT provider, provider_transaction_id, COUNT(*) FROM payments
--    WHERE provider_transaction_id IS NOT NULL GROUP BY 1, 2 HAVING COUNT(*) > 1;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM payments
         WHERE provider_transaction_id IS NOT NULL
         GROUP BY provider, provider_transaction_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE WARNING 'payments: duplicate (provider, provider_transaction_id) rows exist — unique index NOT created';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_provider_tx
            ON payments (provider, provider_transaction_id)
            WHERE provider_transaction_id IS NOT NULL;
    END IF;
END $$;
