package uz.pravaimtihon.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// ============================================
// SubmitAllAnswersRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAllAnswersRequest {

    @NotNull(message = "validation.exam.sessionId.required")
    private Long sessionId;

    @NotEmpty(message = "validation.exam.answers.required")
    @Valid
    private List<SubmitAnswerRequest> answers;
}