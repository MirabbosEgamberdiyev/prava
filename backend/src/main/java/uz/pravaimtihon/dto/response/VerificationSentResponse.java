package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ✅ ENHANCED VerificationSentResponse with Test Mode Support
 *
 * Fields:
 * - recipient: Full recipient (phone/email)
 * - maskedRecipient: Masked for privacy (e.g., "+99890***")
 * - expiresInMinutes: Code expiration time
 * - retryAfterSeconds: Minimum wait before resend
 * - message: Localized success message
 * - testMode: Whether test mode is active
 * - testCode: The actual code (only in test mode)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VerificationSentResponse {

    /**
     * Full recipient identifier
     * Example: "+998901234567" or "user@example.com"
     */
    private String recipient;

    /**
     * Masked recipient for display
     * Example: "+99890***" or "us***@example.com"
     */
    private String maskedRecipient;

    /**
     * Minutes until code expires
     * Default: 10 minutes
     */
    private Integer expiresInMinutes;

    /**
     * Seconds to wait before requesting new code
     * Default: 60 seconds
     */
    private Integer retryAfterSeconds;

    /**
     * Localized success message
     * Example: "Tasdiqlash kodi yuborildi"
     */
    private String message;

    /**
     * ✅ NEW: Indicates if test mode is active
     * When true, testCode will be included in response
     */
    private Boolean testMode;

    /**
     * ✅ NEW: The actual verification code (only in test mode)
     * This field is null in production mode
     *
     * Security Note:
     * - Only included when testMode=true
     * - Never log this field in production
     * - Used for automated testing and development
     */
    private String testCode;
}