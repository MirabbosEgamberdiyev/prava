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
 * Imtihon boshlash so'rovi.
 * Faqat packageId kerak - sessiya har doim saqlanadi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Imtihon boshlash so'rovi")
public class ExamStartRequest {

    @NotNull(message = "validation.exam.packageId.required")
    @Schema(description = "Paket ID", example = "1", required = true)
    private Long packageId;

    @Min(value = 5, message = "validation.exam.duration.min")
    @Max(value = 180, message = "validation.exam.duration.max")
    @Schema(description = "Davomiylik (daqiqa, ixtiyoriy)", example = "30")
    private Integer durationMinutes;
}
