package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Qurilma limiti sozlash so'rovi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Foydalanuvchi qurilma limitini sozlash")
public class DeviceLimitRequest {

    @NotNull(message = "validation.deviceLimit.userId.required")
    @Schema(description = "Foydalanuvchi ID", required = true, example = "1")
    private Long userId;

    @NotNull(message = "validation.deviceLimit.maxDevices.required")
    @Min(value = 1, message = "validation.deviceLimit.maxDevices.min")
    @Max(value = 10, message = "validation.deviceLimit.maxDevices.max")
    @Schema(description = "Maksimal qurilmalar soni (1-10)", required = true, example = "4")
    private Integer maxDevices;
}
