package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating/updating topics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicRequest {

    @NotBlank(message = "validation.topic.code.required")
    @Pattern(regexp = "^[a-z0-9_]+$", message = "validation.topic.code.pattern")
    @Size(min = 3, max = 100, message = "validation.topic.code.size")
    private String code;

    @NotBlank(message = "validation.topic.name.uzl.required")
    @Size(max = 200, message = "validation.topic.name.size")
    private String nameUzl;

    @Size(max = 200, message = "validation.topic.name.size")
    private String nameUzc;

    @Size(max = 200, message = "validation.topic.name.size")
    private String nameEn;

    @Size(max = 200, message = "validation.topic.name.size")
    private String nameRu;

    @Size(max = 5000, message = "validation.topic.description.size")
    private String descriptionUzl;

    @Size(max = 5000, message = "validation.topic.description.size")
    private String descriptionUzc;

    @Size(max = 5000, message = "validation.topic.description.size")
    private String descriptionEn;

    @Size(max = 5000, message = "validation.topic.description.size")
    private String descriptionRu;

    @Size(max = 500, message = "validation.topic.icon.size")
    private String iconUrl;

    @Min(value = 0, message = "validation.topic.order.min")
    private Integer displayOrder;

    @Builder.Default
    private Boolean isActive = true;

    /**
     * Check if question has image
     */
    public boolean hasImage() {
        return iconUrl != null && !iconUrl.isBlank();
    }
}