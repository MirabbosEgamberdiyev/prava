package uz.pravaimtihon.simulator.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.simulator.entity.SimulatorExerciseResult;

import java.util.List;

@Repository
public interface SimulatorExerciseResultRepository extends JpaRepository<SimulatorExerciseResult, Long> {

    List<SimulatorExerciseResult> findBySessionId(Long sessionId);

    @Query("SELECT r.exerciseNumber, COUNT(r) as failCount FROM SimulatorExerciseResult r " +
           "JOIN r.session s " +
           "WHERE s.user.id = :userId AND r.isPassed = false AND r.deleted = false " +
           "GROUP BY r.exerciseNumber ORDER BY failCount DESC")
    List<Object[]> findWeakExercisesByUserId(@Param("userId") Long userId);
}
