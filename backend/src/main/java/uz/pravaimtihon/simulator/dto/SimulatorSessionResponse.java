package uz.pravaimtihon.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.simulator.enums.SimulatorMode;
import uz.pravaimtihon.simulator.enums.SimulatorSessionStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorSessionResponse {
    private Long id;
    private Long userId;
    private SimulatorMode mode;
    private SimulatorSessionStatus status;
    private Integer totalPenaltyPoints;
    private Boolean isPassed;
    private Integer timeSpentSeconds;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private String vehicleModel;
    @Builder.Default
    private List<SimulatorExerciseResultDto> exerciseResults = new ArrayList<>();
    @Builder.Default
    private List<SimulatorPenaltyEventDto> penaltyEvents = new ArrayList<>();
}
