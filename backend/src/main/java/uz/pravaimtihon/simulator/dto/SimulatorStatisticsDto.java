package uz.pravaimtihon.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorStatisticsDto {
    private Long totalSessions;
    private Long passedSessions;
    private Long failedSessions;
    private Double passRate;
    private Double averageScore;
    private Integer bestScore;
    private Double averageTimeSeconds;
    @Builder.Default
    private List<WeakExerciseDto> weakExercises = new ArrayList<>();
}
