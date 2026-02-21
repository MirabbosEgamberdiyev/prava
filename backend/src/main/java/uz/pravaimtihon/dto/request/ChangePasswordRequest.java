package uz.pravaimtihon.dto.request;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ============================================
// ChangePasswordRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "validation.password.current.required")
    private String currentPassword;

    @NotBlank(message = "validation.user.password.required")
    @Size(min = 6, max = 100, message = "validation.user.password.size")
    private String newPassword;
}