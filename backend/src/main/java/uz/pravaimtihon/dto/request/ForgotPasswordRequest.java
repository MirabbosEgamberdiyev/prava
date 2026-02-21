package uz.pravaimtihon.dto.request;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.VerificationType;

// ============================================
// ForgotPasswordRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForgotPasswordRequest {

    @NotBlank(message = "validation.verification.recipient.required")
    private String identifier; // Phone or email

    @NotNull(message = "validation.verification.type.required")
    private VerificationType verificationType;
}