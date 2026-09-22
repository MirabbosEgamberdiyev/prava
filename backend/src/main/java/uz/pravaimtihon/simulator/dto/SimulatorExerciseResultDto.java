package uz.pravaimtihon.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorExerciseResultDto {
    private Integer exerciseNumber;
    private Boolean isPassed;
    private Integer penaltyPoints;
    private Integer timeSpentSeconds;
}
