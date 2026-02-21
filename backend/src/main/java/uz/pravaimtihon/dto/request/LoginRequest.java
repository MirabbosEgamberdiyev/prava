package uz.pravaimtihon.dto.request;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// ============================================
// LoginRequest.java
// ============================================
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "validation.login.identifier.required")
    @Schema(description = "Phone or email", example = "superadmin@pravaimtihon.uz")
    private String identifier; // Phone or email

    @NotBlank(message = "validation.login.password.required")
    @Schema(description = "Password", example = "SuperAdmin@123")
    private String password;
}