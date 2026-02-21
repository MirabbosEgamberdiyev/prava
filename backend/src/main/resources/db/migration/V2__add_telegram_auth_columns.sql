-- V2: Add Telegram authentication columns to users table
-- This migration adds support for Telegram Login Widget authentication

-- Add telegram_id column (unique identifier from Telegram)
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255) UNIQUE;

-- Add telegram_username column
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);

-- Create index for telegram_id lookups
CREATE INDEX IF NOT EXISTS idx_user_telegram_id ON users(telegram_id);

-- Add TELEGRAM to oauth_provider enum check if exists
-- Note: PostgreSQL enum handling - if using VARCHAR this is not needed
-- The Java enum already has TELEGRAM value
