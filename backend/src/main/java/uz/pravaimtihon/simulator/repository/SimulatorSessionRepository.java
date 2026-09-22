package uz.pravaimtihon.simulator.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.simulator.entity.SimulatorSession;

import java.util.List;

@Repository
public interface SimulatorSessionRepository extends JpaRepository<SimulatorSession, Long> {

    List<SimulatorSession> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(s) FROM SimulatorSession s WHERE s.user.id = :userId AND s.deleted = false")
    Long countSessionsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM SimulatorSession s WHERE s.user.id = :userId AND s.isPassed = true AND s.deleted = false")
    Long countPassedSessionsByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(AVG(s.totalPenaltyPoints), 0) FROM SimulatorSession s WHERE s.user.id = :userId AND s.deleted = false")
    Double getAverageScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(MIN(s.totalPenaltyPoints), 0) FROM SimulatorSession s WHERE s.user.id = :userId AND s.deleted = false")
    Integer getBestScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(AVG(s.timeSpentSeconds), 0) FROM SimulatorSession s WHERE s.user.id = :userId AND s.deleted = false")
    Double getAverageTimeByUserId(@Param("userId") Long userId);
}
