package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Imtihon javoblarini topshirish so'rovi.
 * sessionId - majburiy.
 * answers - javoblar ro'yxati.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Imtihon javoblarini topshirish so'rovi")
public class ExamSubmitRequest {

    @NotNull(message = "validation.exam.sessionId.required")
    @Schema(description = "Sessiya ID", example = "1", required = true)
    private Long sessionId;

    @NotEmpty(message = "validation.exam.answers.required")
    @Valid
    @Schema(description = "Javoblar ro'yxati", required = true)
    private List<AnswerSubmitRequest> answers;
}
