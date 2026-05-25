package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import uz.pravaimtihon.entity.ActivationCodeStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Full detail DTO for a single activation code.
 * Includes the computed {@code displayGroup} field so the frontend
 * can render badge colours without re-computing dates.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActivationCodeResponse {

    private Long id;

    // Client info
    private String clientFirstName;
    private String clientLastName;
    private String clientFullName;       // firstName + " " + lastName
    private String clientPhone;
    private String learningCenter;

    // License info
    private String machineId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String licenseKey;

    // Status
    private ActivationCodeStatus status;

    /**
     * Virtual display group — computed from status + endDate:
     * "ACTIVE" | "EXPIRING" | "EXPIRED" | "DEACTIVATED"
     */
    private String displayGroup;

    /** Days remaining until expiry (negative if already expired). */
    private long daysUntilExpiry;

    // Admin metadata
    private String notes;
    private String generatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
