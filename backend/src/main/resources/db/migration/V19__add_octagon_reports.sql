-- =====================================================================
-- Migration V19: Add Octagon Reports / Abuse Complaints Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS octagon_reports (
    id UUID PRIMARY KEY,
    match_id VARCHAR(64),
    reporter_id VARCHAR(64) NOT NULL,
    reported_user_id VARCHAR(64) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_octagon_reports_reported ON octagon_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_octagon_reports_created ON octagon_reports(created_at DESC);
