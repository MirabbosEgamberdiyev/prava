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
 * Marafon rejimida imtihon boshlash so'rovi.
 * Foydalanuvchi faqat savollar sonini ko'rsatadi.
 * Sessiya har doim saqlanadi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Marafon rejimida imtihon boshlash so'rovi")
public class MarathonStartRequest {

    @Schema(description = "Mavzu ID (ixtiyoriy - null bo'lsa barcha mavzulardan)", example = "1")
    private Long topicId;

    @NotNull(message = "validation.marathon.questionCount.required")
    @Min(value = 5, message = "validation.marathon.questionCount.min")
    @Max(value = 100, message = "validation.marathon.questionCount.max")
    @Schema(description = "Savollar soni (5-100)", example = "20", required = true)
    private Integer questionCount;

    @Schema(description = "Davomiylik (daqiqa) - default: savollar soni", example = "30")
    private Integer durationMinutes;

    @Schema(description = "O'tish bali (foiz) - default: 70", example = "70")
    @Min(value = 1, message = "validation.marathon.passingScore.min")
    @Max(value = 100, message = "validation.marathon.passingScore.max")
    private Integer passingScore;
}
