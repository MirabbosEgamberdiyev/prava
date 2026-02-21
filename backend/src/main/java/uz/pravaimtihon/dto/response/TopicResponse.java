package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for topic (localized).
 * Includes both the localized "name"/"description" and all language variants
 * so admin panel can display/edit all translations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TopicResponse {
    private Long id;
    private String code;
    private String name; // Localized based on Accept-Language
    private String description; // Localized based on Accept-Language
    // All language variants for admin editing
    private String nameUzl;
    private String nameUzc;
    private String nameEn;
    private String nameRu;
    private String descriptionUzl;
    private String descriptionUzc;
    private String descriptionEn;
    private String descriptionRu;
    private String iconUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private Long questionCount;
}
