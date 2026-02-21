package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.AcceptLanguage;

// ============================================
// StartExamRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StartExamRequest {

    @NotNull(message = "validation.exam.packageId.required")
    private Long packageId;

    @NotNull(message = "validation.exam.language.required")
    private AcceptLanguage language;
}