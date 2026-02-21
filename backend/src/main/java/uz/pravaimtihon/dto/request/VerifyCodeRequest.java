package uz.pravaimtihon.dto.request;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.VerificationType;
// ============================================
// VerifyCodeRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyCodeRequest {

    @NotBlank(message = "validation.verification.recipient.required")
    private String recipient;

    @NotBlank(message = "validation.verification.code.required")
    @Pattern(regexp = "^[0-9]{6}$", message = "validation.verification.code.pattern")
    private String code;

    @NotNull(message = "validation.verification.type.required")
    private VerificationType type;
}