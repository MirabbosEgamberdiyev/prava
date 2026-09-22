package uz.pravaimtihon.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeakExerciseDto {
    private Integer exerciseNumber;
    private String exerciseCode;
    private String titleUzl;
    private String titleUzc;
    private String titleRu;
    private Long failCount;
}
