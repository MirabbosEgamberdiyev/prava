package uz.pravaimtihon.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamStartResponse {
    private Long sessionId;
    private Long packageId;
    private String packageName;
    private AcceptLanguage language;
    private Integer totalQuestions;
    private Integer durationMinutes;
    private Integer passingScore;
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;
    private List<ExamQuestionResponse> questions;
}