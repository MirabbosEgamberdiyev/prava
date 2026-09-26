package uz.pravaimtihon.simulator.service;

import uz.pravaimtihon.simulator.dto.*;
import uz.pravaimtihon.simulator.entity.SimulatorExerciseConfig;
import uz.pravaimtihon.simulator.entity.SimulatorVehicleConfig;

import java.util.List;

public interface SimulatorService {

    SimulatorSessionResponse createSession(Long userId, StartSimulatorSessionRequest request);

    SimulatorSessionResponse getSession(Long userId, Long sessionId);

    void recordPenalty(Long userId, Long sessionId, RecordSimulatorPenaltyRequest request);

    SimulatorSessionResponse finishSession(Long userId, Long sessionId, FinishSimulatorSessionRequest request);

    SimulatorStatisticsDto getUserStatistics(Long userId);

    List<WeakExerciseDto> getWeakExercises(Long userId);

    List<SimulatorExerciseConfig> getActiveExercises();

    List<SimulatorVehicleConfig> getVehicleConfigs();
}
