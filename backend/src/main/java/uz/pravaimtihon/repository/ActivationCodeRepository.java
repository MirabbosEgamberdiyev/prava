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
     * To'liq filterli so'rov.
     * Qidiruv: machineId, kompyuter nomi, MAC, o'quv markazi nomi.
     * Filter: computerId, learningCenterId, status, generatedBy, sanalar.
     */
    @Query("""
            SELECT ac FROM ActivationCode ac
            LEFT JOIN ac.computer comp
            LEFT JOIN comp.learningCenter lc
            WHERE ac.deleted = false
              AND (:compId IS NULL OR comp.id = :compId)
              AND (:lcId   IS NULL OR lc.id   = :lcId)
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)   LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.name)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.macAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.name)        LIKE LOWER(CONCAT('%', :search, '%'))
              ))
              AND (:status IS NULL OR ac.status = :status)
              AND (:generatedBy IS NULL OR :generatedBy = '' OR ac.createdBy = :generatedBy)
              AND (:startDateFrom IS NULL OR ac.startDate >= :startDateFrom)
              AND (:startDateTo   IS NULL OR ac.startDate <= :startDateTo)
              AND (:endDateFrom   IS NULL OR ac.endDate   >= :endDateFrom)
              AND (:endDateTo     IS NULL OR ac.endDate   <= :endDateTo)
            """)
    Page<ActivationCode> findFiltered(
            @Param("compId")        Long compId,
            @Param("lcId")          Long lcId,
            @Param("search")        String search,
            @Param("status")        ActivationCodeStatus status,
            @Param("generatedBy")   String generatedBy,
            @Param("startDateFrom") LocalDate startDateFrom,
            @Param("startDateTo")   LocalDate startDateTo,
            @Param("endDateFrom")   LocalDate endDateFrom,
            @Param("endDateTo")     LocalDate endDateTo,
            Pageable pageable
    );

    // ── Group queries ─────────────────────────────────────────────────────

    @Query("""
            SELECT ac FROM ActivationCode ac
            LEFT JOIN ac.computer comp
            LEFT JOIN comp.learningCenter lc
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= :threshold
              AND (:compId IS NULL OR comp.id = :compId)
              AND (:lcId   IS NULL OR lc.id   = :lcId)
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)   LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.name)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.macAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.name)        LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findActiveGroup(
            @Param("threshold") LocalDate threshold,
            @Param("compId")    Long compId,
            @Param("lcId")      Long lcId,
            @Param("search")    String search,
            Pageable pageable
    );

    @Query("""
            SELECT ac FROM ActivationCode ac
            LEFT JOIN ac.computer comp
            LEFT JOIN comp.learningCenter lc
            WHERE ac.deleted = false
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= :today
              AND ac.endDate < :threshold
              AND (:compId IS NULL OR comp.id = :compId)
              AND (:lcId   IS NULL OR lc.id   = :lcId)
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)   LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.name)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.macAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.name)        LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findExpiringGroup(
            @Param("today")     LocalDate today,
            @Param("threshold") LocalDate threshold,
            @Param("compId")    Long compId,
            @Param("lcId")      Long lcId,
            @Param("search")    String search,
            Pageable pageable
    );

    @Query("""
            SELECT ac FROM ActivationCode ac
            LEFT JOIN ac.computer comp
            LEFT JOIN comp.learningCenter lc
            WHERE ac.deleted = false
              AND (ac.status = 'EXPIRED' OR (ac.status = 'ACTIVE' AND ac.endDate < :today))
              AND (:compId IS NULL OR comp.id = :compId)
              AND (:lcId   IS NULL OR lc.id   = :lcId)
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)   LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.name)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.macAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.name)        LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findExpiredGroup(
            @Param("today")  LocalDate today,
            @Param("compId") Long compId,
            @Param("lcId")   Long lcId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            SELECT ac FROM ActivationCode ac
            LEFT JOIN ac.computer comp
            LEFT JOIN comp.learningCenter lc
            WHERE ac.deleted = false
              AND ac.status = 'DEACTIVATED'
              AND (:compId IS NULL OR comp.id = :compId)
              AND (:lcId   IS NULL OR lc.id   = :lcId)
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(ac.machineId)   LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.name)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(comp.macAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.name)        LIKE LOWER(CONCAT('%', :search, '%'))
              ))
            """)
    Page<ActivationCode> findDeactivatedGroup(
            @Param("compId") Long compId,
            @Param("lcId")   Long lcId,
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

    // ── Scheduled job ─────────────────────────────────────────────────────

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
