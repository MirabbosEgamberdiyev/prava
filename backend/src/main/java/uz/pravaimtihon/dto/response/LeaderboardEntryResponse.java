package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryResponse {
    private Integer rank;
    private Long userId;
    private String userName;
    private Double bestScore;
    private Double averageScore;
    private Integer totalExams;
    private Integer currentStreak;
}