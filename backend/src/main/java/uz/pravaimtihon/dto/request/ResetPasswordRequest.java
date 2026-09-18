package uz.pravaimtihon.dto.request;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.VerificationType;
// ============================================
// ResetPasswordRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordRequest {

    @NotBlank(message = "validation.verification.recipient.required")
    private String recipient;

    @NotBlank(message = "validation.verification.code.required")
    @Pattern(regexp = "^[0-9]{6}$", message = "validation.verification.code.pattern")
    private String code;

    @NotBlank(message = "validation.user.password.required")
    @Size(min = 8, max = 100, message = "validation.user.password.size")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "validation.user.password.complexity"
    )
    private String newPassword;

    @NotNull(message = "validation.verification.type.required")
    private VerificationType verificationType;
}
