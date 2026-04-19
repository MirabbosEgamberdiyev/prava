-- =====================================================================
--  Payment module tables
--  Safe to run alongside existing schema — references users(id) and
--  exam_packages(id) which already exist.
-- =====================================================================

CREATE TABLE IF NOT EXISTS payments (
    id                        BIGSERIAL PRIMARY KEY,
    user_id                   BIGINT         NOT NULL REFERENCES users(id),
    package_id                BIGINT         NOT NULL REFERENCES exam_packages(id),

    amount                    NUMERIC(14,2)  NOT NULL,
    provider                  VARCHAR(20)    NOT NULL,
    state                     VARCHAR(20)    NOT NULL,

    merchant_order_id         VARCHAR(100)   UNIQUE,
    provider_transaction_id   VARCHAR(100),
    merchant_prepare_id       BIGINT,

    payme_state_code          INT,
    payme_create_time         BIGINT,
    payme_perform_time        BIGINT,
    payme_cancel_time         BIGINT,
    payme_cancel_reason       INT,

    paid_at                   TIMESTAMP,
    cancelled_at              TIMESTAMP,
    raw_last_request          TEXT,

    -- BaseEntity columns
    created_at                TIMESTAMP      NOT NULL DEFAULT NOW(),
    created_by                VARCHAR(100),
    updated_at                TIMESTAMP,
    updated_by                VARCHAR(100),
    deleted                   BOOLEAN        NOT NULL DEFAULT FALSE,
    deleted_at                TIMESTAMP,
    deleted_by                VARCHAR(100),
    version                   BIGINT
);

CREATE INDEX IF NOT EXISTS idx_payments_user          ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_package       ON payments(package_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_order ON payments(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx   ON payments(provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_state         ON payments(state);


CREATE TABLE IF NOT EXISTS user_package_access (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT    NOT NULL REFERENCES users(id),
    package_id     BIGINT    NOT NULL REFERENCES exam_packages(id),
    payment_id     BIGINT    REFERENCES payments(id),

    granted_at     TIMESTAMP NOT NULL,
    expires_at     TIMESTAMP,
    revoked        BOOLEAN   NOT NULL DEFAULT FALSE,
    revoked_at     TIMESTAMP,
    revoke_reason  VARCHAR(255),

    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by     VARCHAR(100),
    updated_at     TIMESTAMP,
    updated_by     VARCHAR(100),
    deleted        BOOLEAN   NOT NULL DEFAULT FALSE,
    deleted_at     TIMESTAMP,
    deleted_by     VARCHAR(100),
    version        BIGINT,

    CONSTRAINT uk_upa_user_package UNIQUE (user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_upa_user     ON user_package_access(user_id);
CREATE INDEX IF NOT EXISTS idx_upa_package  ON user_package_access(package_id);
