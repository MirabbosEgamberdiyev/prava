package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Imtihon statistikasi - batafsil analitika.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamStatisticsResponse {

    private Long sessionId;

    // ============================================
    // Asosiy statistika
    // ============================================

    private Integer totalQuestions;
    private Integer answeredCount;
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer unansweredCount;
    private Integer score;
    private Double percentage;
    private Boolean isPassed;
    private Integer passingScore;

    // ============================================
    // Vaqt statistikasi
    // ============================================

    /**
     * Umumiy sarflangan vaqt (soniya)
     */
    private Long durationSeconds;

    /**
     * Savolga o'rtacha sarflangan vaqt (soniya)
     */
    private Double averageTimePerQuestion;

    /**
     * Eng tez javob berilgan vaqt (soniya)
     */
    private Long fastestAnswerTime;

    /**
     * Eng sekin javob berilgan vaqt (soniya)
     */
    private Long slowestAnswerTime;

    // ============================================
    // Qo'shimcha analitika
    // ============================================

    /**
     * To'g'ri javoblar foizi
     */
    private Double correctPercentage;

    /**
     * Javob berilmagan savollar foizi
     */
    private Double unansweredPercentage;

    /**
     * Marathon rejimi belgisi
     */
    private Boolean isMarathonMode;
}
