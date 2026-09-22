package uz.pravaimtihon.simulator.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.simulator.entity.SimulatorExerciseConfig;

import java.util.List;
import java.util.Optional;

@Repository
public interface SimulatorExerciseConfigRepository extends JpaRepository<SimulatorExerciseConfig, Long> {

    List<SimulatorExerciseConfig> findByIsActiveTrueOrderByExerciseNumberAsc();

    Optional<SimulatorExerciseConfig> findByExerciseNumber(Integer exerciseNumber);

    Optional<SimulatorExerciseConfig> findByCode(String code);
}
