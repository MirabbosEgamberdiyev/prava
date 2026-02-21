package uz.pravaimtihon.dto.request;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
// ============================================
// SubmitAnswerRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitAnswerRequest {

    @NotNull(message = "validation.answer.questionId.required")
    private Long questionId;

    @NotNull(message = "validation.answer.optionIndex.required")
    @Min(value = 0, message = "validation.answer.optionIndex.min")
    private Integer selectedOptionIndex;

    private Long timeSpentSeconds;
}