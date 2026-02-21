package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicStatsResponse {
    private String topic;
    private Long totalQuestions;
    private Long totalExams;
    private Double averageScore;
    private Long passedExams;
}