package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.ActivationCode;
import uz.pravaimtihon.entity.ActivationCodeStatus;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ActivationCodeRepository extends JpaRepository<ActivationCode, Long> {

    // ── Existence checks ──────────────────────────────────────────────────

    boolean existsByLicenseKey(String licenseKey);

    Optional<ActivationCode> findByLicenseKey(String licenseKey);

    // ── Dynamic filtered listing ──────────────────────────────────────────

    /**
     * Full-featured filtered query.
     * <ul>
     *   <li>search — case-insensitive LIKE across machineId, names, phone, learning centre</li>
     *   <li>status — exact enum match (null = all)</li>
     *   <li>createdBy — exact match (null = all)</li>
     *   <li>startDateFrom/To — inclusive date range on startDate</li>
     *   <li>endDateFrom/To   — inclusive date range on endDate</li>
     * </ul>
     * Deleted records are always excluded.
     */
    @Query("""
            SELECT ac FROM ActivationCode ac
            WHERE ac.deleted = false
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)        LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientFirstName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientLastName)   LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientPhone)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.learningCenter)   LIKE LOWER(CONCAT('%', :search, '%'))
              ))
              AND (:status IS NULL OR ac.status = :status)
              AND (:generatedBy IS NULL OR :generatedBy = '' OR ac.createdBy = :generatedBy)
              AND (:startDateFrom IS NULL OR ac.startDate >= :startDateFrom)
              AND (:startDateTo   IS NULL OR ac.startDate <= :startDateTo)
              AND (:endDateFrom   IS NULL OR ac.endDate   >= :endDateFrom)
              AND (:endDateTo     IS NULL OR ac.endDate   <= :endDateTo)
            """)
    Page<ActivationCode> findFiltered(
            @Param("search")        String search,
            @Param("status")        ActivationCodeStatus status,
            @Param("generatedBy")   String generatedBy,
            @Param("startDateFrom") LocalDate startDateFrom,
            @Param("startDateTo")   LocalDate startDateTo,
            @Param("endDateFrom")   LocalDate endDateFrom,
            @Param("endDateTo")     LocalDate endDateTo,
            Pageable pageable
    );

    /**
     * Group = ACTIVE: status=ACTIVE AND endDate >= today+3 (not expiring soon).
     */
    @Query("""
            SELECT ac FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= :threshold
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)       LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientFirstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientLastName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientPhone)     LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.learningCenter)  LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findActiveGroup(
            @Param("threshold") LocalDate threshold,
            @Param("search")    String search,
            Pageable pageable
    );

    /**
     * Group = EXPIRING: status=ACTIVE AND endDate in [today, today+3).
     */
    @Query("""
            SELECT ac FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= :today
              AND ac.endDate < :threshold
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)       LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientFirstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientLastName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientPhone)     LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.learningCenter)  LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findExpiringGroup(
            @Param("today")     LocalDate today,
            @Param("threshold") LocalDate threshold,
            @Param("search")    String search,
            Pageable pageable
    );

    /**
     * Group = EXPIRED: status=EXPIRED OR (status=ACTIVE AND endDate < today).
     */
    @Query("""
            SELECT ac FROM ActivationCode ac
            WHERE ac.deleted = false
              AND (ac.status = 'EXPIRED' OR (ac.status = 'ACTIVE' AND ac.endDate < :today))
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)       LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientFirstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientLastName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientPhone)     LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.learningCenter)  LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findExpiredGroup(
            @Param("today")  LocalDate today,
            @Param("search") String search,
            Pageable pageable
    );

    /**
     * Group = DEACTIVATED.
     */
    @Query("""
            SELECT ac FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.status = 'DEACTIVATED'
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)       LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientFirstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientLastName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.clientPhone)     LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(ac.learningCenter)  LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findDeactivatedGroup(
            @Param("search") String search,
            Pageable pageable
    );

    // ── Stats counts ──────────────────────────────────────────────────────

    @Query("SELECT COUNT(ac) FROM ActivationCode ac WHERE ac.deleted = false")
    long countAll();

    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= :threshold
            """)
    long countActive(@Param("threshold") LocalDate threshold);

    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= :today
              AND ac.endDate < :threshold
            """)
    long countExpiring(@Param("today") LocalDate today, @Param("threshold") LocalDate threshold);

    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            WHERE ac.deleted = false
              AND (ac.status = 'EXPIRED' OR (ac.status = 'ACTIVE' AND ac.endDate < :today))
            """)
    long countExpired(@Param("today") LocalDate today);

    @Query("SELECT COUNT(ac) FROM ActivationCode ac WHERE ac.deleted = false AND ac.status = 'DEACTIVATED'")
    long countDeactivated();

    // ── Scheduled job helpers ─────────────────────────────────────────────

    /**
     * Bulk-marks overdue ACTIVE codes as EXPIRED.
     * Called by a nightly scheduled task.
     */
    @Modifying
    @Query("""
            UPDATE ActivationCode ac
            SET ac.status = 'EXPIRED'
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate < :today
            """)
    int markExpiredBatch(@Param("today") LocalDate today);
}
