package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.VerificationType;

// ============================================
// RegisterRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "validation.user.firstName.required")
    @Size(min = 2, max = 50, message = "validation.user.firstName.size")
    private String firstName;

    @Size(max = 50, message = "validation.user.lastName.size")
    private String lastName;

    @Pattern(regexp = "^\\+?998[0-9]{9}$", message = "validation.user.phone.pattern")
    private String phoneNumber;

    @Email(message = "validation.user.email.valid")
    private String email;

    @NotBlank(message = "validation.user.password.required")
    @Size(min = 8, max = 100, message = "validation.user.password.size")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "validation.user.password.complexity"
    )
    private String password;

    @NotNull(message = "validation.verification.type.required")
    private VerificationType verificationType;

    @Builder.Default
    private AcceptLanguage preferredLanguage = AcceptLanguage.UZL;
}