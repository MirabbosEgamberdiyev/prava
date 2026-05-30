package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.dto.response.exam.OptionResponse;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WrongAnswerResponse {
    private Long questionId;
    private Integer wrongCount;
    private LocalDateTime lastSeen;
    private LocalizedText text;
    private String imageUrl;
    private List<OptionResponse> options;
    private Integer correctOptionIndex;
    private LocalizedText explanation;
    private Long topicId;
    private LocalizedText topicName;
}
