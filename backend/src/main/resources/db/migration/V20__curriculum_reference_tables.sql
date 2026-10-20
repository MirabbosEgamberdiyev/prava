-- Curriculum reference tables used by CurriculumDataController (JdbcTemplate, no JPA entities).
-- They existed only in the production database (created by a one-off import), so a fresh
-- environment built from code had no such tables and /api/v1/curriculum/* answered 500.
-- Schema mirrors production exactly; IF NOT EXISTS makes this a no-op where the tables exist.
-- Reference data itself is restored from the content dump / admin import, not seeded here.

CREATE TABLE IF NOT EXISTS road_signs (
    id                 BIGSERIAL PRIMARY KEY,
    code               VARCHAR(50)  NOT NULL UNIQUE,
    category           VARCHAR(50)  NOT NULL,
    number_in_category INTEGER,
    title_uzl          TEXT         NOT NULL,
    title_uzc          TEXT,
    title_ru           TEXT,
    description_uzl    TEXT,
    description_uzc    TEXT,
    description_ru     TEXT,
    image_file         VARCHAR(255),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS road_markings (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,
    marking_type    VARCHAR(50)  NOT NULL,
    title_uzl       TEXT         NOT NULL,
    title_uzc       TEXT,
    title_ru        TEXT,
    description_uzl TEXT,
    description_uzc TEXT,
    description_ru  TEXT,
    image_file      VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_centers (
    id              VARCHAR(100) PRIMARY KEY,
    region_uzl      VARCHAR(200) NOT NULL,
    region_uzc      VARCHAR(200),
    region_ru       VARCHAR(200),
    address_uzl     TEXT         NOT NULL,
    address_uzc     TEXT,
    address_ru      TEXT,
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    map_url         TEXT,
    phones          TEXT,
    work_days       VARCHAR(100),
    work_hours      VARCHAR(100),
    transport_uzl   TEXT,
    transport_uzc   TEXT,
    transport_ru    TEXT,
    price_theory    INTEGER DEFAULT 100000,
    price_practical INTEGER DEFAULT 150000,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practical_exercises (
    id                 BIGSERIAL PRIMARY KEY,
    exercise_number    INTEGER NOT NULL UNIQUE,
    title_uzl          TEXT    NOT NULL,
    title_uzc          TEXT,
    title_ru           TEXT,
    description_uzl    TEXT,
    description_uzc    TEXT,
    description_ru     TEXT,
    max_penalty_points INTEGER DEFAULT 100,
    image_url          TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practical_penalties (
    id             BIGSERIAL PRIMARY KEY,
    penalty_number INTEGER NOT NULL,
    severity       VARCHAR(50),
    points         INTEGER NOT NULL,
    text_uzl       TEXT    NOT NULL,
    text_uzc       TEXT,
    text_ru        TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
