package uz.pravaimtihon.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorPenaltyEventDto {
    private Long id;
    private Integer exerciseNumber;
    private String ruleCode;
    private Integer points;
    private Double posX;
    private Double posY;
    private Integer occurredAtSeconds;
}
