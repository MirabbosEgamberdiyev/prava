package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.PackageGenerationType;

import java.math.BigDecimal;

/**
 * ✅ Package response with full multilingual support
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageResponse {
    private Long id;
    private String name;               // Localized name
    private String description;        // Localized description
    private Integer questionCount;     // Expected question count
    private Integer durationMinutes;
    private Integer passingScore;
    private PackageGenerationType generationType;
    private String topic;              // Topic code
    private String topicName;          // ✅ Localized topic name
    private Boolean isActive;
    private Boolean isFree;
    private BigDecimal price;
    private Integer orderIndex;
    private Integer actualQuestionCount; // Actual question count in package
}