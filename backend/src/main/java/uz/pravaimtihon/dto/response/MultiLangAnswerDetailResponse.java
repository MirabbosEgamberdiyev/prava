package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Answer detail with all 4 language variants.
 * Includes correct answer and explanation (shown after submission).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiLangAnswerDetailResponse {

    private Long questionId;
    private Integer questionOrder;
    private MultiLangText questionText;
    private String imageUrl;
    private List<MultiLangOptionResponse> options;
    private Integer selectedOptionIndex;
    private Integer correctOptionIndex;
    private Boolean isCorrect;
    private MultiLangText explanation;
    private Long timeSpentSeconds;
}
