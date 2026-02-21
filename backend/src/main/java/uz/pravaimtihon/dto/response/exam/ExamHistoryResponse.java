package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.ExamStatus;

import java.time.LocalDateTime;

/**
 * Imtihon tarixi - qisqacha ma'lumot.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExamHistoryResponse {

    private Long sessionId;
    private Long packageId;
    private LocalizedText packageName;
    private Long ticketId;
    private Integer ticketNumber;
    private Long topicId;
    private LocalizedText topicName;
    private ExamStatus status;
    private Boolean isMarathonMode;
    private Boolean isTicketMode;

    private Integer totalQuestions;
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer unansweredCount;
    private Double percentage;
    private Boolean isPassed;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Long durationSeconds;
}
