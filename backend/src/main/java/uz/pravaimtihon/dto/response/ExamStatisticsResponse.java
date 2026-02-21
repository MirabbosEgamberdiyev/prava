package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ✅ Exam Statistics Response DTO
 * Detailed statistics for a completed exam
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamStatisticsResponse {

    private Long sessionId;
    private Integer totalQuestions;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer unansweredCount;
    private Integer score;
    private Double percentage;
    private Boolean isPassed;
    private Long durationSeconds;
    private Double averageTimePerQuestion;
}