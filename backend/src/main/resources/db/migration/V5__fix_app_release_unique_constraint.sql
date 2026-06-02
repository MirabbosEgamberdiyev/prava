-- Drop the old unique constraint that blocks soft-deleted records
ALTER TABLE app_releases DROP CONSTRAINT IF EXISTS uq_app_release_platform_type_version;

-- Add a partial unique index that only applies to non-deleted records
CREATE UNIQUE INDEX uq_app_release_platform_type_version_active
    ON app_releases (platform, app_type, release_version)
    WHERE deleted = false;
