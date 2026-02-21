package uz.pravaimtihon.dto.request;


import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.AcceptLanguage;

/**
 * ✅ UpdateUserRequest - For updating user details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @Size(min = 2, max = 50, message = "validation.user.firstName.size")
    private String firstName;

    @Size(max = 50, message = "validation.user.lastName.size")
    private String lastName;

    @Pattern(regexp = "^\\+?998[0-9]{9}$", message = "validation.user.phone.pattern")
    private String phoneNumber;

    @Email(message = "validation.user.email.valid")
    private String email;

    private AcceptLanguage preferredLanguage;
}