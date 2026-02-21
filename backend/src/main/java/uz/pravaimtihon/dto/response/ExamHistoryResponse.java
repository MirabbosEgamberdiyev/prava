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
public class ExamHistoryResponse {
    private Long totalExams;
    private Long completedExams;
    private Long passedExams;
    private Double averageScore;
    private Double bestScore;
    private List<ExamSessionResponse> recentExams;
}