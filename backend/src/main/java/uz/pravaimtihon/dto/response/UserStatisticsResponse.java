package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// ============================================
// Statistics DTOs
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatisticsResponse {
    private Long userId;
    private String userName;
    private String topic;
    private Integer totalExams;
    private Integer passedExams;
    private Integer failedExams;
    private Double successRate;
    private Double averageScore;
    private Double bestScore;
    private Integer currentStreak;
    private Integer longestStreak;
    private Long totalTimeSpentSeconds;
    private Double accuracy;
}