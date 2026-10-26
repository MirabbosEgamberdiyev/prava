-- =====================================================================
-- V25: Add INPAY to payments_provider_check constraint
-- =====================================================================

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check CHECK (provider IN ('CLICK', 'PAYME', 'INPAY', 'MANUAL'));
