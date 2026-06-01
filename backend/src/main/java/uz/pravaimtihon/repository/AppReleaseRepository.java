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

    boolean existsByPlatformAndAppTypeAndAppVersionAndDeletedFalse(
            AppPlatform platform, AppType appType, String appVersion);

    boolean existsByPlatformAndAppTypeAndAppVersionAndIdNotAndDeletedFalse(
            AppPlatform platform, AppType appType, String appVersion, Long id);

    // ── Latest ────────────────────────────────────────────────────────────

    Optional<AppRelease> findByPlatformAndAppTypeAndIsLatestTrueAndDeletedFalse(
            AppPlatform platform, AppType appType);

    List<AppRelease> findAllByIsLatestTrueAndStatusAndDeletedFalse(AppReleaseStatus status);

    // ── Filtered paginated list ───────────────────────────────────────────

    /**
     * Public default method — null/blank string'larni xavfsiz "%" markeriga aylantiradi.
     *
     * <p>Hibernate 6.x va PostgreSQL'da null parametr bilan {@code LOWER(CONCAT('%', :p, '%'))}
     * "function lower(bytea) does not exist" xatosi beradi. Buni Java tomonidan
     * "%search_term%" ko'rinishida tayyorlab yuborish bilan oldini olamiz.</p>
     */
    default Page<AppRelease> findFiltered(
            AppPlatform platform,
            AppType appType,
            AppReleaseStatus status,
            String appName,
            String version,
            Pageable pageable) {

        String namePattern    = toLikePattern(appName);
        String versionPattern = toLikePattern(version);

        return findFilteredInternal(platform, appType, status, namePattern, versionPattern, pageable);
    }

    /** "abc" → "%abc%" (lowercased); null/bo'sh → "%" (har doim mos keladi). */
    private static String toLikePattern(String s) {
        if (s == null) return "%";
        String trimmed = s.trim();
        if (trimmed.isEmpty()) return "%";
        return "%" + trimmed.toLowerCase() + "%";
    }

    @Query("""
        SELECT r FROM AppRelease r
        WHERE r.deleted = false
          AND (:platform IS NULL OR r.platform = :platform)
          AND (:appType  IS NULL OR r.appType  = :appType)
          AND (:status   IS NULL OR r.status   = :status)
          AND LOWER(r.appName)    LIKE :appName
          AND LOWER(r.appVersion) LIKE :version
        """)
    Page<AppRelease> findFilteredInternal(
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
