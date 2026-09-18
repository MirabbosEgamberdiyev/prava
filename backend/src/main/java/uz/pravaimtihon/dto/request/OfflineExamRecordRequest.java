package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Offline imtihon natijasini serverga sinxronizatsiya qilish so'rovi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Offline imtihon natijasini yozish so'rovi")
public class OfflineExamRecordRequest {

    @Schema(description = "Mijozdagi sessiya ID yoki timestamp", example = "1710000000")
    private String clientSessionId;

    @Schema(description = "Imtihon turi (ticket, real, marathon)", example = "real")
    private String examType;

    @Schema(description = "Paket ID yoki Bilet ID (ixtiyoriy)", example = "1")
    private Long targetId;

    @Schema(description = "Umumiy sarflangan vaqt (soniya)", example = "600")
    private Long durationSeconds;

    @Schema(description = "Tugatilgan vaqt (epoch millis)", example = "1710000000000")
    private Long completedAt;

    @NotEmpty(message = "validation.exam.answers.required")
    @Valid
    @Schema(description = "Javoblar ro'yxati", required = true)
    private List<AnswerSubmitRequest> answers;
}
