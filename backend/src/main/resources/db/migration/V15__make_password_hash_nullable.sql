-- V15: Make password_hash nullable in users table
-- Since the system now uses OAuth authentication exclusively (Google & Telegram),
-- password authentication and password hash are no longer required.

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
