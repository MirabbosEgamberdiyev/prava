package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.LearningCenter;
import uz.pravaimtihon.entity.LearningCenterStatus;

import java.util.List;

@Repository
public interface LearningCenterRepository extends JpaRepository<LearningCenter, Long> {

    // ── Filtered paginated listing ─────────────────────────────────────────

    @Query("""
            SELECT lc FROM LearningCenter lc
            WHERE lc.deleted = false
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(lc.name)          LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.address)       LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.phone)         LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.contactPerson) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(lc.email)         LIKE LOWER(CONCAT('%', :search, '%'))
              ))
              AND (:status IS NULL OR lc.status = :status)
            """)
    Page<LearningCenter> findFiltered(
            @Param("search") String search,
            @Param("status") LearningCenterStatus status,
            Pageable pageable
    );

    // ── Dropdown list (ACTIVE only, sorted by name) ───────────────────────

    @Query("""
            SELECT lc FROM LearningCenter lc
            WHERE lc.deleted = false
              AND lc.status = uz.pravaimtihon.entity.LearningCenterStatus.ACTIVE
            ORDER BY lc.name ASC
            """)
    List<LearningCenter> findAllActiveOrderByName();

    // ── Count helpers ─────────────────────────────────────────────────────

    long countByDeletedFalse();

    long countByDeletedFalseAndStatus(LearningCenterStatus status);

    // ── Stats aggregates (codes attached) ────────────────────────────────

    /**
     * Total non-deleted activation codes whose computer belongs to this learning center.
     */
    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            JOIN ac.computer comp
            WHERE ac.deleted = false
              AND comp.learningCenter.id = :lcId
            """)
    long countTotalCodes(@Param("lcId") Long lcId);

    /**
     * Active or expiring codes whose computer belongs to this learning center.
     */
    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            JOIN ac.computer comp
            WHERE ac.deleted = false
              AND comp.learningCenter.id = :lcId
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= CURRENT_DATE
            """)
    long countActiveCodes(@Param("lcId") Long lcId);

    /**
     * Number of non-deleted computers registered under this learning center.
     */
    @Query("""
            SELECT COUNT(c) FROM Computer c
            WHERE c.deleted = false
              AND c.learningCenter.id = :lcId
            """)
    long countComputers(@Param("lcId") Long lcId);
}
