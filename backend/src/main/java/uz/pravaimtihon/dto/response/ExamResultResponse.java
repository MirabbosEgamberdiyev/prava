package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.ExamStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResultResponse {
    private Long sessionId;
    private Long packageId;
    private String packageName;
    private ExamStatus status;
    private Integer totalQuestions;
    private Integer answeredCount;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer score;
    private Double percentage;
    private Boolean isPassed;
    private Integer passingScore;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Long durationSeconds;
    private List<ExamAnswerDetailResponse> answerDetails;
}
