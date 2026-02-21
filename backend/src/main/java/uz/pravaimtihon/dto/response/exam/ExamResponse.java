package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Imtihon boshlash javobi.
 * Barcha savollar 4 tilda qaytariladi.
 * visibleMode bo'lsa, to'g'ri javoblar ham qaytariladi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamResponse {

    /**
     * Sessiya ID - tracked bo'lsa bazada saqlanadi
     */
    private Long sessionId;

    /**
     * Paket ma'lumotlari (marathon rejimida null)
     */
    private Long packageId;
    private LocalizedText packageName;

    /**
     * Mavzu ma'lumotlari
     */
    private Long topicId;
    private LocalizedText topicName;

    /**
     * Imtihon sozlamalari
     */
    private Integer totalQuestions;
    private Integer durationMinutes;
    private Integer passingScore;

    /**
     * Vaqt ma'lumotlari
     */
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;

    /**
     * Marathon rejimi belgisi
     */
    private Boolean isMarathonMode;

    /**
     * Visible rejimi belgisi
     * true = to'g'ri javoblar ko'rsatilgan
     * false = to'g'ri javoblar yashirin
     */
    private Boolean isVisibleMode;

    /**
     * Savollar ro'yxati - 4 tilda
     */
    private List<QuestionResponse> questions;
}
