package uz.pravaimtihon.simulator.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FinishSimulatorSessionRequest {

    @NotNull(message = "Total penalty points are required")
    private Integer totalPenaltyPoints;

    @NotNull(message = "Time spent seconds is required")
    private Integer timeSpentSeconds;

    @NotNull(message = "isPassed flag is required")
    private Boolean isPassed;

    private List<SimulatorExerciseResultDto> exerciseResults = new ArrayList<>();
}
