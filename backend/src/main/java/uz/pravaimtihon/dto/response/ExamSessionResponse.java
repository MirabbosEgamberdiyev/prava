package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSessionResponse {
    private Long id;
    private Long packageId;
    private String packageName;
    private ExamStatus status;
    private AcceptLanguage language;
    private Integer totalQuestions;
    private Integer answeredCount;
    private Integer correctCount;
    private Integer score;
    private Double percentage;
    private Boolean isPassed;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Long durationSeconds;
}