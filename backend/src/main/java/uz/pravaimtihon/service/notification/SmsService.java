package uz.pravaimtihon.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.service.MessageService;

import java.util.HashMap;
import java.util.Map;

/**
 * ✅ ENHANCED SmsService with Test Mode
 *
 * Features:
 * - Test mode: Log only without API call
 * - Production mode: Send via Eskiz.uz API
 * - Token caching with expiration handling
 * - Comprehensive error handling
 */
@Service
@Slf4j
public class SmsService {

    private final RestTemplate restTemplate;
    private final MessageService messageService;

    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${app.sms.mock:false}")
    private boolean mockMode;

    @Value("${app.sms.test-mode.log-only:true}")
    private boolean testModeLogOnly;

    @Value("${app.sms.eskiz.email}")
    private String eskizEmail;

    @Value("${app.sms.eskiz.password}")
    private String eskizPassword;

    @Value("${app.sms.eskiz.sender-id:4546}")
    private String senderId;

    private static final String BASE_URL = "https://notify.eskiz.uz/api";
    private String cachedToken;

    public SmsService(RestTemplate restTemplate, MessageService messageService) {
        this.restTemplate = restTemplate;
        this.messageService = messageService;
    }

    /**
     * ✅ ENHANCED: Send SMS with mock and test mode support
     *
     * Mode Behavior:
     * - If mockMode=true: Print code to System.out (console) for easy testing
     * - If smsEnabled=false OR testModeLogOnly=true: Only log, no API call
     * - Otherwise: Send real SMS via Eskiz.uz API
     */
    public void sendSms(String phoneNumber, String code, AcceptLanguage language) {
        String message = messageService.getMessage(
                "sms.verification.code",
                new Object[]{code, 10}, // 10 minutes expiry
                language.toLocale()
        );

        log.info("📱 SMS Service: recipient={}, mockMode={}, testMode={}, enabled={}",
                maskPhone(phoneNumber), mockMode, testModeLogOnly, smsEnabled);

        // ✅ MOCK MODE: Print to console (System.out) for easy testing
        if (mockMode) {
            System.out.println("================================================");
            System.out.println("📱 [SMS MOCK MODE] Verification Code");
            System.out.println("================================================");
            System.out.println("Phone: " + phoneNumber);
            System.out.println("Code:  " + code);
            System.out.println("================================================");
            log.info("🧪 [MOCK MODE] SMS verification code printed to console");
            return;
        }

        // ✅ Test Mode: Log only (for backward compatibility)
        if (!smsEnabled || testModeLogOnly) {
            log.info("🧪 [TEST MODE] SMS would be sent:");
            log.info("   Phone: {}", phoneNumber);
            log.info("   Code: {}", code);
            log.info("   Message: {}", message);
            log.info("   Language: {}", language);
            return;
        }

        // ✅ Production Mode: Send real SMS
        try {
            String token = getAuthToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);

            Map<String, String> body = new HashMap<>();
            body.put("mobile_phone", phoneNumber);
            body.put("message", message);
            body.put("from", senderId);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            log.debug("📤 Sending SMS to Eskiz.uz API: phone={}", maskPhone(phoneNumber));

            ResponseEntity<String> response = restTemplate.exchange(
                    BASE_URL + "/message/sms/send",
                    HttpMethod.POST,
                    request,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("✅ SMS sent successfully to: {}", maskPhone(phoneNumber));
            } else {
                log.error("❌ SMS send failed with status: {}", response.getStatusCode());
                throw new BusinessException("error.sms.send.failed");
            }

        } catch (RestClientException e) {
            log.error("❌ Eskiz.uz API error", e);
            // Invalidate cached token on auth errors
            if (e.getMessage() != null && e.getMessage().contains("401")) {
                cachedToken = null;
            }
            throw new BusinessException("error.sms.send.failed");
        } catch (Exception e) {
            log.error("❌ Unexpected error sending SMS", e);
            throw new BusinessException("error.sms.send.failed");
        }
    }

    /**
     * ✅ Get Eskiz.uz authentication token with caching
     */
    private String getAuthToken() {
        if (cachedToken != null) {
            return cachedToken;
        }

        try {
            log.debug("🔑 Authenticating with Eskiz.uz");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("email", eskizEmail);
            body.put("password", eskizPassword);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    BASE_URL + "/auth/login",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                if (data != null && data.containsKey("token")) {
                    cachedToken = (String) data.get("token");
                    log.info("✅ Eskiz.uz authentication successful");
                    return cachedToken;
                }
            }

            throw new BusinessException("Failed to authenticate with SMS provider");

        } catch (Exception e) {
            log.error("❌ Eskiz.uz authentication failed", e);
            throw new BusinessException("error.sms.auth.failed");
        }
    }

    /**
     * ✅ Mask phone number for privacy
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return "***";
        }
        return phone.substring(0, 6) + "***";
    }

    /**
     * ✅ Public method to check if SMS is enabled (production mode)
     */
    public boolean isSmsEnabled() {
        return smsEnabled && !testModeLogOnly && !mockMode;
    }

    /**
     * ✅ Check if mock mode is enabled
     */
    public boolean isMockMode() {
        return mockMode;
    }
}