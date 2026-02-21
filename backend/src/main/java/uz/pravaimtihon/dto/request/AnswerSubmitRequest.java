package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bitta savol uchun javob.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bitta savol uchun javob")
public class AnswerSubmitRequest {

    @NotNull(message = "validation.answer.questionId.required")
    @Schema(description = "Savol ID", example = "1", required = true)
    private Long questionId;

    @Schema(description = "Tanlangan variant indeksi (null = javob berilmagan)", example = "0")
    private Integer selectedOptionIndex;

    @Schema(description = "Savolga sarflangan vaqt (soniya)", example = "30")
    private Long timeSpentSeconds;
}
