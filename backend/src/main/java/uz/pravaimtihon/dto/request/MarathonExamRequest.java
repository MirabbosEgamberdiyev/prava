package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.AcceptLanguage;

/**
 * Request for starting a Marathon Mode exam.
 * Marathon Mode allows users to practice with dynamically generated question sets
 * without using predefined exam packages.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to start a Marathon Mode exam session")
public class MarathonExamRequest {

    @Schema(description = "Topic ID to filter questions (optional - null for all topics)", example = "1")
    private Long topicId;

    @NotNull(message = "validation.marathon.questionCount.required")
    @Min(value = 5, message = "validation.marathon.questionCount.min")
    @Max(value = 100, message = "validation.marathon.questionCount.max")
    @Schema(description = "Number of questions for the marathon (5-100)", example = "20", required = true)
    private Integer questionCount;

    @NotNull(message = "validation.marathon.language.required")
    @Schema(description = "Language for questions and UI", example = "EN", required = true)
    private AcceptLanguage language;

    @Schema(description = "Duration in minutes (optional - default is calculated based on question count)", example = "30")
    private Integer durationMinutes;

    @Schema(description = "Passing score percentage (optional - default 70%)", example = "70")
    private Integer passingScore;
}
