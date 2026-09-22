package uz.pravaimtihon.simulator.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.simulator.entity.SimulatorAuditLog;

import java.util.List;

@Repository
public interface SimulatorAuditLogRepository extends JpaRepository<SimulatorAuditLog, Long> {

    List<SimulatorAuditLog> findTop50ByOrderByCreatedAtDesc();
}
