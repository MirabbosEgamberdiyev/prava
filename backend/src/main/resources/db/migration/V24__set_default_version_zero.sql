-- V24: Initialize null version columns to 0 for optimistic locking
UPDATE exam_packages SET version = 0 WHERE version IS NULL;
UPDATE payments SET version = 0 WHERE version IS NULL;
UPDATE user_package_access SET version = 0 WHERE version IS NULL;

ALTER TABLE exam_packages ALTER COLUMN version SET DEFAULT 0;
ALTER TABLE payments ALTER COLUMN version SET DEFAULT 0;
ALTER TABLE user_package_access ALTER COLUMN version SET DEFAULT 0;
