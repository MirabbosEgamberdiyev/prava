package uz.pravaimtihon.dto.request;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOptionRequest {

    private Integer optionIndex;

    @Size(max = 500, message = "validation.option.text.size")
    private String textUzl;

    @Size(max = 500, message = "validation.option.text.size")
    private String textUzc;

    @Size(max = 500, message = "validation.option.text.size")
    private String textEn;

    @Size(max = 500, message = "validation.option.text.size")
    private String textRu;
}