package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAnswerDetailResponse {
    private Long questionId;
    private Integer questionOrder;
    private String questionText;
    private String imageUrl;
    private List<ExamOptionResponse> options;
    private Integer selectedOptionIndex;
    private Integer correctOptionIndex;
    private Boolean isCorrect;
    private String explanation;
    private Long timeSpentSeconds;
}