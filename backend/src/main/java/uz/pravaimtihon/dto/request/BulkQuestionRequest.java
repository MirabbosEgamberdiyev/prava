package uz.pravaimtihon.dto.request;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkQuestionRequest {

    @Valid
    private List<QuestionRequest> questions;
}