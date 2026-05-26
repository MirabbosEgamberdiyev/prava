package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.Computer;
import uz.pravaimtihon.entity.ComputerStatus;

import java.util.List;

@Repository
public interface ComputerRepository extends JpaRepository<Computer, Long> {

    // ── Filtered paginated listing ─────────────────────────────────────────

    @Query("""
            SELECT c FROM Computer c
            JOIN c.learningCenter lc
            WHERE c.deleted = false
              AND (:lcId IS NULL OR lc.id = :lcId)
              AND (:search IS NULL OR :search = '' OR (
                    LOWER(c.name)      LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(c.machineId) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(c.macAddress) LIKE LOWER(CONCAT('%', :search, '%')) OR
                    LOWER(c.deviceId)  LIKE LOWER(CONCAT('%', :search, '%'))
              ))
              AND (:status IS NULL OR c.status = :status)
            """)
    Page<Computer> findFiltered(
            @Param("lcId")    Long lcId,
            @Param("search")  String search,
            @Param("status")  ComputerStatus status,
            Pageable pageable
    );

    // ── Dropdown: all ACTIVE computers for a given LC ─────────────────────

    @Query("""
            SELECT c FROM Computer c
            WHERE c.deleted = false
              AND c.learningCenter.id = :lcId
              AND c.status = uz.pravaimtihon.entity.ComputerStatus.ACTIVE
            ORDER BY c.name ASC
            """)
    List<Computer> findActiveByLearningCenter(@Param("lcId") Long lcId);

    // ── All ACTIVE computers across all LCs (for global dropdown) ─────────

    @Query("""
            SELECT c FROM Computer c
            JOIN FETCH c.learningCenter lc
            WHERE c.deleted = false
              AND c.status = uz.pravaimtihon.entity.ComputerStatus.ACTIVE
            ORDER BY lc.name ASC, c.name ASC
            """)
    List<Computer> findAllActive();

    // ── Existence checks ──────────────────────────────────────────────────

    boolean existsByMachineIdAndDeletedFalse(String machineId);

    boolean existsByMachineIdAndIdNotAndDeletedFalse(String machineId, Long id);

    // ── Count helpers ─────────────────────────────────────────────────────

    long countByLearningCenterIdAndDeletedFalse(Long lcId);

    long countByLearningCenterIdAndDeletedFalseAndStatus(Long lcId, ComputerStatus status);

    // ── Activation code stats per computer ────────────────────────────────

    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.computer.id = :compId
            """)
    long countTotalCodes(@Param("compId") Long compId);

    @Query("""
            SELECT COUNT(ac) FROM ActivationCode ac
            WHERE ac.deleted = false
              AND ac.computer.id = :compId
              AND ac.status = 'ACTIVE'
              AND ac.endDate >= CURRENT_DATE
            """)
    long countActiveCodes(@Param("compId") Long compId);
}
