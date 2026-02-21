package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Javobni tekshirish so'rovi.
 * Frontend uchun tezkor feedback olish.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Javobni tekshirish so'rovi")
public class CheckAnswerRequest {

    @NotNull(message = "validation.check.questionId.required")
    @Schema(description = "Savol ID", example = "1", required = true)
    private Long questionId;

    @NotNull(message = "validation.check.optionIndex.required")
    @Min(value = 0, message = "validation.check.optionIndex.min")
    @Schema(description = "Tanlangan variant indeksi", example = "0", required = true)
    private Integer selectedOptionIndex;
}
