-- =====================================================================
-- Migration V7: Add Autodrome 3D Simulator Tables
-- PravaOnline Professional Driving License Simulation Module
-- =====================================================================

-- 1. Exercise Configurations (Config-driven 12 official exercises)
CREATE TABLE IF NOT EXISTS simulator_exercises (
    id BIGSERIAL PRIMARY KEY,
    exercise_number INT NOT NULL UNIQUE,
    code VARCHAR(64) NOT NULL UNIQUE,
    title_uzl VARCHAR(255) NOT NULL,
    title_uzc VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    description_uzl TEXT,
    description_uzc TEXT,
    description_ru TEXT,
    time_limit_seconds INT NOT NULL DEFAULT 60,
    max_speed_kmh INT NOT NULL DEFAULT 40,
    max_penalty_allowed INT NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- 2. Penalty Rules Configuration
CREATE TABLE IF NOT EXISTS simulator_penalty_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_code VARCHAR(64) NOT NULL UNIQUE,
    title_uzl VARCHAR(255) NOT NULL,
    title_uzc VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    points INT NOT NULL DEFAULT 20,
    severity VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- MINOR, MEDIUM, MAJOR, CRITICAL
    is_instant_fail BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- 3. Vehicle Configurations (e.g. Cobalt, Gentra, Malibu)
CREATE TABLE IF NOT EXISTS simulator_vehicle_configs (
    id BIGSERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL UNIQUE,
    mass_kg FLOAT NOT NULL DEFAULT 1250.0,
    max_speed_kmh FLOAT NOT NULL DEFAULT 45.0,
    acceleration_power FLOAT NOT NULL DEFAULT 0.35,
    braking_power FLOAT NOT NULL DEFAULT 0.55,
    steering_angle_max FLOAT NOT NULL DEFAULT 35.0,
    wheelbase_meters FLOAT NOT NULL DEFAULT 2.62,
    track_width_meters FLOAT NOT NULL DEFAULT 1.73,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- 4. Simulator Sessions
CREATE TABLE IF NOT EXISTS simulator_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode VARCHAR(32) NOT NULL, -- TRAINING, PRACTICE, EXAM
    status VARCHAR(32) NOT NULL DEFAULT 'CREATED', -- CREATED, READY, RUNNING, PAUSED, COMPLETED, FAILED, ABORTED
    total_penalty_points INT NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    finished_at TIMESTAMP WITHOUT TIME ZONE,
    vehicle_model VARCHAR(100) DEFAULT 'Chevrolet Cobalt',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- 5. Individual Exercise Results in a Session
CREATE TABLE IF NOT EXISTS simulator_exercise_results (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES simulator_sessions(id) ON DELETE CASCADE,
    exercise_number INT NOT NULL,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    penalty_points INT NOT NULL DEFAULT 0,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- 6. Penalty Events Log
CREATE TABLE IF NOT EXISTS simulator_penalty_events (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES simulator_sessions(id) ON DELETE CASCADE,
    exercise_number INT NOT NULL,
    rule_code VARCHAR(64) NOT NULL,
    points INT NOT NULL,
    pos_x FLOAT,
    pos_y FLOAT,
    occurred_at_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- 7. Audit Log for Admin Actions
CREATE TABLE IF NOT EXISTS simulator_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_type VARCHAR(64) NOT NULL,
    target_entity VARCHAR(64) NOT NULL,
    target_id VARCHAR(64),
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    updated_by VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    deleted_by VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_sim_sessions_user ON simulator_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_sessions_status ON simulator_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sim_ex_results_session ON simulator_exercise_results(session_id);
CREATE INDEX IF NOT EXISTS idx_sim_penalties_session ON simulator_penalty_events(session_id);
CREATE INDEX IF NOT EXISTS idx_sim_audit_action ON simulator_audit_logs(action_type);
