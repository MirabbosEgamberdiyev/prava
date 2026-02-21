package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * ✅ NEW: Patch request for partial package updates
 * All fields are optional - only provided fields will be updated
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackagePatchRequest {

    @Size(max = 200, message = "validation.package.name.size")
    private String nameUzl;

    @Size(max = 200, message = "validation.package.name.size")
    private String nameUzc;

    @Size(max = 200, message = "validation.package.name.size")
    private String nameEn;

    @Size(max = 200, message = "validation.package.name.size")
    private String nameRu;

    @Size(max = 5000, message = "validation.package.description.size")
    private String descriptionUzl;

    @Size(max = 5000, message = "validation.package.description.size")
    private String descriptionUzc;

    @Size(max = 5000, message = "validation.package.description.size")
    private String descriptionEn;

    @Size(max = 5000, message = "validation.package.description.size")
    private String descriptionRu;

    @Min(value = 5, message = "validation.package.duration.min")
    @Max(value = 180, message = "validation.package.duration.max")
    private Integer durationMinutes;

    @Min(value = 0, message = "validation.package.passingScore.min")
    @Max(value = 100, message = "validation.package.passingScore.max")
    private Integer passingScore;

    @NotNull(message = "validation.package.questionCount.required")
    @Min(value = 1, message = "validation.package.questionCount.min")
    @Max(value = 100, message = "validation.package.questionCount.max")
    private Integer questionCount;

    private Boolean isFree;

    @DecimalMin(value = "0.0", message = "validation.package.price.min")
    private BigDecimal price;

    private Integer orderIndex;

    private Boolean isActive;

    private List<Long> questionIds;

}