package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicQuestionStatResponse {
    private Long topicId;
    private String topicCode;
    private String topicName;
    private Long totalQuestions;
    private Long activeQuestions;
    private Long easyQuestions;
    private Long mediumQuestions;
    private Long hardQuestions;
    private Double averageSuccessRate;
}