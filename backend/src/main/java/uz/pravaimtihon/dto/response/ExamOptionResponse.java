package uz.pravaimtihon.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamOptionResponse {
    private Long id;
    private Integer optionIndex;
    private String text;
}