package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request DTO for generating a new activation code.
 * clientFirstName, clientLastName, clientPhone are optional —
 * they are recorded when known but not required.
 */
@Data
public class ActivationCodeRequest {

    /** Optional — stored for traceability. */
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String clientFirstName;

    /** Optional — stored for traceability. */
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String clientLastName;

    /**
     * Optional — when provided must be a valid phone number format.
     * The regex accepts null/empty (treated as "not supplied").
     */
    @Pattern(
            regexp = "^$|^[+]?[0-9\\s\\-()]{7,20}$",
            message = "Invalid phone number format"
    )
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String clientPhone;

    /** Optional — only set when this code is issued to a learning centre. */
    @Size(max = 200, message = "Learning center name must not exceed 200 characters")
    private String learningCenter;

    @NotBlank(message = "Machine ID is required")
    @Size(min = 4, max = 255, message = "Machine ID must be between 4 and 255 characters")
    private String machineId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    /** Optional admin note (reason for issuance, etc.). */
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
