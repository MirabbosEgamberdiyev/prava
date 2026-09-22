package uz.pravaimtihon.simulator.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import uz.pravaimtihon.simulator.enums.SimulatorMode;

@Data
public class StartSimulatorSessionRequest {

    @NotNull(message = "Mode is required")
    private SimulatorMode mode;

    private String vehicleModel = "Chevrolet Cobalt";
}
