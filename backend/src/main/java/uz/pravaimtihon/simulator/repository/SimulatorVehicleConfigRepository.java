package uz.pravaimtihon.simulator.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.simulator.entity.SimulatorVehicleConfig;

import java.util.Optional;

@Repository
public interface SimulatorVehicleConfigRepository extends JpaRepository<SimulatorVehicleConfig, Long> {

    Optional<SimulatorVehicleConfig> findByIsDefaultTrue();

    Optional<SimulatorVehicleConfig> findByModelName(String modelName);
}
