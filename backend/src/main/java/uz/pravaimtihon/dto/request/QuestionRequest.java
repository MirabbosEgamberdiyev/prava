package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.QuestionDifficulty;

import java.util.List;

/**
 * ✅ QuestionRequest DTO with Image URL support
 *
 * **Two ways to create Question with image:**
 *
 * 1. RECOMMENDED: Pre-upload image, then use imageUrl
 *    Step 1: POST /api/v1/files/upload (file, folder="questions") -> returns imageUrl
 *    Step 2: POST /api/v1/admin/questions (JSON body with imageUrl)
 *
 * 2. Direct multipart upload (for convenience)
 *    POST /api/v1/admin/questions (multipart/form-data with imageFile)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Question creation/update request with multi-language support")
public class QuestionRequest {

    // ============ QUESTION TEXT (Multi-language) ============

    @Size(max = 2000, message = "validation.question.text.length")
    @Schema(
            description = "Question text in Uzbek Latin (optional)",
            example = "Yo'l belgisi nimani bildiradi?"
    )
    private String textUzl;

    @Size(max = 2000, message = "validation.question.text.length")
    @Schema(
            description = "Question text in Uzbek Cyrillic (optional)",
            example = "Йўл белгиси нимани билдиради?"
    )
    private String textUzc;

    @Size(max = 2000, message = "validation.question.text.length")
    @Schema(
            description = "Question text in English (optional)",
            example = "What does the road sign indicate?"
    )
    private String textEn;

    @Size(max = 2000, message = "validation.question.text.length")
    @Schema(
            description = "Question text in Russian (optional)",
            example = "Что означает дорожный знак?"
    )
    private String textRu;

    // ============ EXPLANATION (Multi-language) ============

    @Size(max = 3000, message = "validation.question.explanation.length")
    @Schema(
            description = "Explanation in Uzbek Latin (optional)",
            example = "Bu belgi transport vositalarini to'xtatishni taqiqlaydi."
    )
    private String explanationUzl;

    @Size(max = 3000, message = "validation.question.explanation.length")
    @Schema(description = "Explanation in Uzbek Cyrillic (optional)")
    private String explanationUzc;

    @Size(max = 3000, message = "validation.question.explanation.length")
    @Schema(description = "Explanation in English (optional)")
    private String explanationEn;

    @Size(max = 3000, message = "validation.question.explanation.length")
    @Schema(description = "Explanation in Russian (optional)")
    private String explanationRu;

    // ============ TOPIC ============

    @Schema(
            description = "Topic ID (optional)",
            example = "1"
    )
    private Long topicId;

    // ============ DIFFICULTY ============

    @Schema(
            description = "Question difficulty level (optional)",
            example = "MEDIUM",
            allowableValues = {"EASY", "MEDIUM", "HARD"}
    )
    private QuestionDifficulty difficulty;

    // ============ OPTIONS ============

    @Size(max = 10, message = "validation.question.options.size")
    @Valid
    @Schema(
            description = "Question options (optional)"
    )
    private List<QuestionOptionRequest> options;

    // ============ CORRECT ANSWER ============

    @Schema(
            description = "Correct answer index (0-based, optional)",
            example = "0"
    )
    private Integer correctAnswerIndex;

    // ============ IMAGE URL ============

    @Size(max = 500, message = "validation.question.imageUrl.length")
    @Schema(
            description = """
            Question image URL (optional)
            
            **How to use:**
            1. Upload image first: POST /api/v1/files/upload
               - folder="questions"
               - Returns: {"fileUrl": "http://localhost:8080/api/v1/files/questions/abc-123.jpg"}
            
            2. Use returned fileUrl here
            
            **Example values:**
            - LOCAL: http://localhost:8080/api/v1/files/questions/abc-123.jpg
            - S3: https://bucket.s3.amazonaws.com/questions/abc-123.jpg
            - Cloudinary: https://res.cloudinary.com/cloud/image/upload/questions/abc-123.jpg
            
            **Alternative:** Use multipart endpoint for direct upload
            POST /api/v1/admin/questions/with-image (multipart/form-data with imageFile)
            """,
            example = "http://localhost:8080/api/v1/files/questions/abc-123.jpg"
    )
    private String imageUrl;

    // ============ STATUS ============

    @Schema(
            description = "Question active status (default: true)",
            example = "true",
            defaultValue = "true"
    )
    @Builder.Default
    private Boolean isActive = true;

    // ============ VALIDATION HELPER METHODS ============

    /**
     * Validate that correctAnswerIndex is within options range
     * This is checked in service layer, but good to have helper
     */
    public boolean isCorrectAnswerIndexValid() {
        if (options == null || correctAnswerIndex == null) {
            return false;
        }
        return correctAnswerIndex >= 0 && correctAnswerIndex < options.size();
    }

    /**
     * Check if question has image
     */
    public boolean hasImage() {
        return imageUrl != null && !imageUrl.isBlank();
    }

    /**
     * Check if all language variants are provided
     */
    public boolean hasAllLanguages() {
        return textUzl != null && textUzc != null &&
                textEn != null && textRu != null;
    }
}