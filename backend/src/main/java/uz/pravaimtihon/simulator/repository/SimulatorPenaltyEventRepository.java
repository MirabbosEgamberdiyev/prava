package uz.pravaimtihon.simulator.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.simulator.entity.SimulatorPenaltyEvent;

import java.util.List;

@Repository
public interface SimulatorPenaltyEventRepository extends JpaRepository<SimulatorPenaltyEvent, Long> {

    List<SimulatorPenaltyEvent> findBySessionIdOrderByOccurredAtSecondsAsc(Long sessionId);
}
