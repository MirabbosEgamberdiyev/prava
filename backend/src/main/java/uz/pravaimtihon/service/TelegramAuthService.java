package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.dto.request.TelegramAuthRequest;
import uz.pravaimtihon.exception.BusinessException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;

/**
 * Service for verifying Telegram Login Widget authentication data.
 *
 * Verification process (as per Telegram docs):
 * 1. Create data_check_string by sorting all received fields (except hash)
 *    alphabetically and joining them with newline character
 * 2. Create secret_key = SHA256(bot_token)
 * 3. Calculate HMAC-SHA256(data_check_string, secret_key)
 * 4. Compare with received hash
 */
@Service
@Slf4j
public class TelegramAuthService {

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Value("${app.oauth.telegram.enabled:true}")
    private boolean enabled;

    @Value("${app.oauth.telegram.auth-data-max-age-seconds:86400}")
    private long authDataMaxAgeSeconds; // Default: 24 hours

    /**
     * Verify Telegram Login Widget authentication data.
     *
     * @param request The authentication data from Telegram Login Widget
     * @throws BusinessException if verification fails
     */
    public void verifyAuthData(TelegramAuthRequest request) {
        if (!enabled) {
            throw new BusinessException("error.telegram.oauth.disabled");
        }

        if (botToken == null || botToken.isBlank()) {
            log.error("Telegram bot token not configured");
            throw new BusinessException("error.telegram.not.configured");
        }

        // Verify auth_date is not too old
        long currentTime = Instant.now().getEpochSecond();
        if (currentTime - request.getAuthDate() > authDataMaxAgeSeconds) {
            log.warn("Telegram auth data expired: auth_date={}, current={}",
                    request.getAuthDate(), currentTime);
            throw new BusinessException("error.telegram.auth.expired");
        }

        // Build data_check_string
        String dataCheckString = buildDataCheckString(request);

        // Calculate expected hash
        String expectedHash = calculateHash(dataCheckString);

        // Compare hashes (case-insensitive)
        if (!expectedHash.equalsIgnoreCase(request.getHash())) {
            log.warn("Telegram auth hash mismatch for user_id={}", request.getId());
            throw new BusinessException("error.telegram.auth.invalid");
        }

        log.info("Telegram auth verified successfully for user_id={}, username={}",
                request.getId(), request.getUsername());
    }

    /**
     * Build data_check_string by sorting fields alphabetically and joining with newline.
     * Format: key=value\nkey=value\n...
     */
    private String buildDataCheckString(TelegramAuthRequest request) {
        // Use TreeMap for automatic alphabetical sorting
        Map<String, String> dataMap = new TreeMap<>();

        dataMap.put("id", String.valueOf(request.getId()));
        dataMap.put("first_name", request.getFirstName());
        dataMap.put("auth_date", String.valueOf(request.getAuthDate()));

        // Optional fields - only include if present
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            dataMap.put("last_name", request.getLastName());
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            dataMap.put("username", request.getUsername());
        }
        if (request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()) {
            dataMap.put("photo_url", request.getPhotoUrl());
        }

        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : dataMap.entrySet()) {
            if (!first) {
                sb.append("\n");
            }
            sb.append(entry.getKey()).append("=").append(entry.getValue());
            first = false;
        }

        return sb.toString();
    }

    /**
     * Calculate HMAC-SHA256 hash.
     * secret_key = SHA256(bot_token)
     * hash = HMAC-SHA256(data_check_string, secret_key)
     */
    private String calculateHash(String dataCheckString) {
        try {
            // Step 1: Create secret key by hashing bot token with SHA-256
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] secretKey = sha256.digest(botToken.getBytes(StandardCharsets.UTF_8));

            // Step 2: Calculate HMAC-SHA256
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secretKey, "HmacSHA256");
            hmac.init(keySpec);
            byte[] hashBytes = hmac.doFinal(dataCheckString.getBytes(StandardCharsets.UTF_8));

            // Step 3: Convert to hex string
            return bytesToHex(hashBytes);

        } catch (Exception e) {
            log.error("Error calculating Telegram auth hash", e);
            throw new BusinessException("error.telegram.auth.failed");
        }
    }

    /**
     * Convert byte array to lowercase hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    /**
     * Check if Telegram OAuth is enabled.
     */
    public boolean isEnabled() {
        return enabled && botToken != null && !botToken.isBlank();
    }
}
