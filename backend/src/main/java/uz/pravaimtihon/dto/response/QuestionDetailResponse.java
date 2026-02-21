package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Admin uchun savol detail response - barcha 4 til varianti qaytariladi.
 * Edit formada barcha tillarni to'ldirish uchun ishlatiladi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDetailResponse {
    private Long id;

    // Question text - all 4 languages
    private String textUzl;
    private String textUzc;
    private String textEn;
    private String textRu;

    // Explanation - all 4 languages
    private String explanationUzl;
    private String explanationUzc;
    private String explanationEn;
    private String explanationRu;

    // Topic info
    private Long topicId;
    private String topicName;

    // Settings
    private String difficulty;
    private Integer correctAnswerIndex;
    private String imageUrl;
    private Boolean isActive;

    // Statistics
    private Long timesUsed;
    private Double successRate;

    // Options with all languages
    private List<QuestionOptionDetailResponse> options;
}
