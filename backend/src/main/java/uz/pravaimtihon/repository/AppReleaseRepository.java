package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.AppPlatform;
import uz.pravaimtihon.entity.AppRelease;
import uz.pravaimtihon.entity.AppReleaseStatus;
import uz.pravaimtihon.entity.AppType;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppReleaseRepository extends JpaRepository<AppRelease, Long> {

    // ── Unique checks ─────────────────────────────────────────────────────
    // NB: method name "AppVersion" corresponds to entity field "appVersion"

    boolean existsByPlatformAndAppTypeAndAppVersionAndDeletedFalse(
            AppPlatform platform, AppType appType, String appVersion);

    boolean existsByPlatformAndAppTypeAndAppVersionAndIdNotAndDeletedFalse(
            AppPlatform platform, AppType appType, String appVersion, Long id);

    // ── Latest ────────────────────────────────────────────────────────────

    Optional<AppRelease> findByPlatformAndAppTypeAndIsLatestTrueAndDeletedFalse(
            AppPlatform platform, AppType appType);

    List<AppRelease> findAllByIsLatestTrueAndStatusAndDeletedFalse(AppReleaseStatus status);

    // ── Filtered paginated list ───────────────────────────────────────────

    @Query("""
        SELECT r FROM AppRelease r
        WHERE r.deleted = false
          AND (:platform  IS NULL OR r.platform    = :platform)
          AND (:appType   IS NULL OR r.appType     = :appType)
          AND (:status    IS NULL OR r.status      = :status)
          AND (:appName   IS NULL OR LOWER(r.appName)   LIKE LOWER(CONCAT('%', :appName, '%')))
          AND (:version   IS NULL OR LOWER(r.appVersion) LIKE LOWER(CONCAT('%', :version, '%')))
        """)
    Page<AppRelease> findFiltered(
            @Param("platform") AppPlatform platform,
            @Param("appType")  AppType appType,
            @Param("status")   AppReleaseStatus status,
            @Param("appName")  String appName,
            @Param("version")  String version,
            Pageable pageable);

    // ── Public: check for update ──────────────────────────────────────────

    @Query("""
        SELECT r FROM AppRelease r
        WHERE r.deleted = false
          AND r.platform = :platform
          AND r.appType  = :appType
          AND r.status   = 'ACTIVE'
          AND r.versionCode > :currentVersionCode
        ORDER BY r.versionCode DESC
        """)
    List<AppRelease> findNewerVersions(
            @Param("platform")           AppPlatform platform,
            @Param("appType")            AppType appType,
            @Param("currentVersionCode") int currentVersionCode,
            Pageable pageable);

    // ── Unset isLatest for same platform+type ─────────────────────────────

    @Modifying
    @Query("""
        UPDATE AppRelease r
        SET r.isLatest = false
        WHERE r.platform = :platform
          AND r.appType  = :appType
          AND r.id      != :excludeId
          AND r.deleted  = false
        """)
    void unsetLatestForOthers(
            @Param("platform")  AppPlatform platform,
            @Param("appType")   AppType appType,
            @Param("excludeId") Long excludeId);

    // ── Increment download count ──────────────────────────────────────────

    @Modifying
    @Query("UPDATE AppRelease r SET r.downloadCount = r.downloadCount + 1 WHERE r.id = :id")
    void incrementDownloadCount(@Param("id") Long id);

    // ── Stats for admin dashboard ─────────────────────────────────────────

    @Query("""
        SELECT COUNT(r) FROM AppRelease r
        WHERE r.deleted = false AND r.status = 'ACTIVE'
        """)
    long countActive();

    @Query("""
        SELECT COALESCE(SUM(r.downloadCount), 0) FROM AppRelease r
        WHERE r.deleted = false
        """)
    long totalDownloads();
}
