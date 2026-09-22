package uz.pravaimtihon.simulator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecordSimulatorPenaltyRequest {

    @NotNull(message = "Exercise number is required")
    private Integer exerciseNumber;

    @NotBlank(message = "Rule code is required")
    private String ruleCode;

    @NotNull(message = "Points are required")
    private Integer points;

    private Double posX;
    private Double posY;

    private Integer occurredAtSeconds = 0;
}
