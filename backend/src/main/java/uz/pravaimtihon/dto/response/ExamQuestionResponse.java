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
public class ExamQuestionResponse {
    private Long id;
    private Integer questionOrder;
    private String text;
    private String imageUrl;
    private List<ExamOptionResponse> options;
    // Note: correctAnswerIndex and explanation NOT included here
    // They will be revealed after exam completion
}