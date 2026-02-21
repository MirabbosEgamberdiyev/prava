package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.ExamStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Imtihon natijasi - to'liq statistika.
 * Barcha javoblar va tushuntirishlar 4 tilda.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamResultResponse {

    private Long sessionId;
    private Long packageId;
    private LocalizedText packageName;
    private Long topicId;
    private LocalizedText topicName;
    private ExamStatus status;
    private Boolean isMarathonMode;

    // ============================================
    // Statistika
    // ============================================

    /**
     * Umumiy savollar soni
     */
    private Integer totalQuestions;

    /**
     * Javob berilgan savollar soni
     */
    private Integer answeredCount;

    /**
     * To'g'ri javoblar soni
     */
    private Integer correctCount;

    /**
     * Noto'g'ri javoblar soni
     */
    private Integer incorrectCount;

    /**
     * Javob berilmagan savollar soni
     */
    private Integer unansweredCount;

    /**
     * Ball (to'g'ri javoblar soni)
     */
    private Integer score;

    /**
     * Foiz (0-100)
     */
    private Double percentage;

    /**
     * O'tdimi?
     */
    private Boolean isPassed;

    /**
     * O'tish bali (foiz)
     */
    private Integer passingScore;

    // ============================================
    // Vaqt ma'lumotlari
    // ============================================

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    /**
     * Umumiy sarflangan vaqt (soniya)
     */
    private Long durationSeconds;

    /**
     * Savolga o'rtacha sarflangan vaqt (soniya)
     */
    private Double averageTimePerQuestion;

    // ============================================
    // Javoblar tafsilotlari
    // ============================================

    /**
     * Barcha javoblar tafsilotlari - 4 tilda
     */
    private List<AnswerDetailResponse> answerDetails;
}
