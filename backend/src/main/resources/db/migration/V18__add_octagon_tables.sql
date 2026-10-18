-- =====================================================================
-- Migration V18: Add Octagon 1v1 PvP Real-Time Intelligence Arena Tables
-- PravaOnline Professional Driving License Octagon Arena
-- =====================================================================

-- 1. Octagon Profile Table
CREATE TABLE IF NOT EXISTS octagon_profiles (
    user_id VARCHAR(64) PRIMARY KEY,
    elo_rating INT NOT NULL DEFAULT 0,
    rank VARCHAR(32) NOT NULL DEFAULT 'BRONZE',
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    win_streak INT NOT NULL DEFAULT 0,
    max_win_streak INT NOT NULL DEFAULT 0,
    total_matches INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_octagon_profiles_elo ON octagon_profiles(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_octagon_profiles_rank ON octagon_profiles(rank);

-- 2. Octagon Matches Table
CREATE TABLE IF NOT EXISTS octagon_matches (
    id UUID PRIMARY KEY,
    player1_id VARCHAR(64) NOT NULL,
    player2_id VARCHAR(64) NOT NULL,
    player1_score INT NOT NULL DEFAULT 0,
    player2_score INT NOT NULL DEFAULT 0,
    winner_id VARCHAR(64),
    is_draw BOOLEAN NOT NULL DEFAULT FALSE,
    game_type VARCHAR(32) NOT NULL DEFAULT 'RANKED_QUEUE',
    status VARCHAR(32) NOT NULL DEFAULT 'ONGOING',
    question_ids TEXT NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    p1_elo_change INT NOT NULL DEFAULT 0,
    p2_elo_change INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_octagon_matches_created_at ON octagon_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_octagon_matches_p1 ON octagon_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_octagon_matches_p2 ON octagon_matches(player2_id);

-- 3. Octagon Challenges (Duel Invites) Table
CREATE TABLE IF NOT EXISTS octagon_challenges (
    id UUID PRIMARY KEY,
    challenger_id VARCHAR(64) NOT NULL,
    target_user_id VARCHAR(64),
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_octagon_challenges_code ON octagon_challenges(invite_code);
CREATE INDEX IF NOT EXISTS idx_octagon_challenges_status ON octagon_challenges(status);
