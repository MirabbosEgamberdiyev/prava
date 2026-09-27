-- B-08: yo'l harakati jarimalari (MJtK) va BHM (bazaviy hisoblash miqdori) — klientlar uchun yagona manba.
-- Summalar so'mda saqlanmaydi: faqat BHM koeffitsientlari (bhm_min / bhm_max). Summa = koeffitsient x joriy BHM.
-- Idempotent (IF NOT EXISTS) — Hibernate ddl-auto=update bilan ham xavfsiz.

CREATE TABLE IF NOT EXISTS traffic_fines (
    id                  BIGSERIAL PRIMARY KEY,
    article_code        VARCHAR(50)   NOT NULL,
    title_uzl           TEXT          NOT NULL,
    title_uzc           TEXT,
    title_ru            TEXT,
    bhm_min             NUMERIC(10,2) NOT NULL,
    bhm_max             NUMERIC(10,2),
    extra_sanction_uzl  TEXT,
    extra_sanction_uzc  TEXT,
    extra_sanction_ru   TEXT,
    sort_order          INT           NOT NULL DEFAULT 0,
    active              BOOLEAN       NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_traffic_fines_bhm_range CHECK (bhm_min >= 0 AND (bhm_max IS NULL OR bhm_max >= bhm_min))
);

CREATE INDEX IF NOT EXISTS idx_traffic_fines_active_sort ON traffic_fines (active, sort_order);

CREATE TABLE IF NOT EXISTS bhm_rates (
    id              BIGSERIAL PRIMARY KEY,
    amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    effective_from  DATE          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bhm_rates_effective_from ON bhm_rates (effective_from);
