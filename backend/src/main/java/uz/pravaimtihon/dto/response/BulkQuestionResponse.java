package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkQuestionResponse {
    private Integer total;
    private Integer success;
    private Integer failed;
    private List<QuestionResponse> successfulQuestions;
    private List<String> errors;
}