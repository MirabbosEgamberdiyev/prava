package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.QuestionDifficulty;

import java.util.List;

/**
 * Updated QuestionResponse with TopicResponse instead of String
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long id;
    private String text; // Localized
    private String explanation; // Localized

    /**
     * Changed to TopicSimpleResponse for proper localization
     */
    private TopicSimpleResponse topic;

    private QuestionDifficulty difficulty;
    private List<QuestionOptionResponse> options;
    private Integer correctAnswerIndex;
    private String imageUrl;
    private Boolean isActive;
    private Long timesUsed;
    private Double successRate;
}