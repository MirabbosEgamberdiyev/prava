package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.PackageGenerationType;

import java.math.BigDecimal;
import java.util.List;

/**
 * ✅ Package detail response with questions
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageDetailResponse {
    private Long id;
    private String name;               // Localized name
    private String description;        // Localized description
    private Integer questionCount;
    private Integer durationMinutes;
    private Integer passingScore;
    private PackageGenerationType generationType;
    private String topic;              // Topic code
    private String topicName;          // ✅ Localized topic name
    private Boolean isActive;
    private Boolean isFree;
    private BigDecimal price;
    private Integer orderIndex;
    private List<QuestionResponse> questions; // All questions in package
}