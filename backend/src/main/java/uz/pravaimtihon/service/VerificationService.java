package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.response.VerificationSentResponse;
import uz.pravaimtihon.entity.VerificationCode;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.VerificationType;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.repository.VerificationCodeRepository;
import uz.pravaimtihon.service.notification.EmailService;
import uz.pravaimtihon.service.notification.SmsService;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * ✅ ENHANCED VerificationService with Test Mode Support
 *
 * Features:
 * - Test mode with configurable default code
 * - Thread-safe verification with pessimistic locking
 * - Comprehensive logging for debugging
 * - Rate limiting per recipient
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {

    private final VerificationCodeRepository verificationRepository;
    private final SmsService smsService;
    private final EmailService emailService;
    private final MessageService messageService;
    private final SecureRandom secureRandom = new SecureRandom();

    // ✅ Configuration Properties
    @Value("${app.verification.test-mode.enabled:false}")
    private boolean testModeEnabled;

    @Value("${app.verification.test-mode.default-code:123456}")
    private String defaultTestCode;

    @Value("${app.verification.code.length:6}")
    private int codeLength;

    @Value("${app.verification.code.expiry-minutes:10}")
    private int codeExpiryMinutes;

    @Value("${app.verification.code.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.verification.code.max-codes-per-hour:10}")
    private int maxCodesPerHour;

    @Value("${app.verification.code.retry-delay-seconds:60}")
    private int retryDelaySeconds;

    /**
     * ✅ ENHANCED: Send verification code with test mode support
     *
     * Test Mode Logic:
     * - If test mode enabled: Always use default code, optionally send real message
     * - If test mode disabled: Generate random code and always send real message
     */
    public VerificationSentResponse sendVerificationCode(
            String recipient,
            VerificationType type,
            AcceptLanguage language
    ) {
        log.info("📨 Sending verification code to: {} via {} [lang={}, testMode={}]",
                maskRecipient(recipient), type, language, testModeEnabled);

        // Rate limit check
        checkRateLimit(recipient, type);

        // ✅ Generate code based on mode
        String code = testModeEnabled ? defaultTestCode : generateCode();

        // Save to database
        VerificationCode verificationCode = VerificationCode.builder()
                .code(code)
                .recipient(recipient)
                .type(type)
                .expiresAt(LocalDateTime.now().plusMinutes(codeExpiryMinutes))
                .build();

        verificationRepository.save(verificationCode);
        log.debug("✅ Verification code saved to DB: recipient={}, type={}, expiresAt={}",
                maskRecipient(recipient), type, verificationCode.getExpiresAt());

        // ✅ Send message (respects service-level test mode)
        try {
            if (type == VerificationType.SMS) {
                smsService.sendSms(recipient, code, language);
            } else {
                emailService.sendVerificationEmail(recipient, code, language);
            }
        } catch (Exception e) {
            log.error("❌ Failed to send verification code to: {}", maskRecipient(recipient), e);
            throw new BusinessException("error.verification.send.failed");
        }

        log.info("✅ Verification code sent successfully to: {} [testMode={}]",
                maskRecipient(recipient), testModeEnabled);

        return VerificationSentResponse.builder()
                .recipient(recipient)
                .maskedRecipient(maskRecipient(recipient))
                .expiresInMinutes(codeExpiryMinutes)
                .retryAfterSeconds(retryDelaySeconds)
                .message(messageService.getMessage("success.verification.sent"))
                .testMode(testModeEnabled)
                .testCode(testModeEnabled ? code : null) // ✅ Return code in test mode
                .build();
    }

    /**
     * ✅ ENHANCED: Verify code with pessimistic locking
     *
     * Thread Safety:
     * - Uses database-level locking to prevent race conditions
     * - Atomic increment of attempts counter
     */
    @Transactional
    public boolean verifyCode(String recipient, String code, VerificationType type) {
        log.info("🔍 Verifying code for: {} [type={}, testMode={}]",
                maskRecipient(recipient), type, testModeEnabled);

        if (code == null || code.isBlank()) {
            log.warn("⚠️ Empty verification code provided for: {}", maskRecipient(recipient));
            return false;
        }

        // ✅ Find and lock verification code (pessimistic lock)
        VerificationCode verificationCode = verificationRepository
                .findValidCodeWithLock(recipient, type, LocalDateTime.now())
                .orElse(null);

        if (verificationCode == null) {
            log.warn("⚠️ No valid verification code found for: {} [type={}]",
                    maskRecipient(recipient), type);
            return false;
        }

        // Check max attempts
        if (verificationCode.isMaxAttemptsReached()) {
            log.warn("⚠️ Max verification attempts reached for: {}", maskRecipient(recipient));
            throw new BusinessException("error.verification.code.max.attempts");
        }

        // ✅ Increment attempts atomically
        verificationCode.incrementAttempts();
        verificationRepository.save(verificationCode);

        // Verify code
        if (!verificationCode.getCode().equals(code.trim())) {
            log.warn("⚠️ Incorrect verification code for: {} [attempts={}]",
                    maskRecipient(recipient), verificationCode.getAttemptCount());
            return false;
        }

        // Mark as used
        verificationCode.markAsUsed();
        verificationRepository.save(verificationCode);

        log.info("✅ Verification code verified successfully for: {}", maskRecipient(recipient));
        return true;
    }

    /**
     * ✅ Check rate limit per recipient
     */
    private void checkRateLimit(String recipient, VerificationType type) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentCount = verificationRepository.countRecentCodes(
                recipient, type, oneHourAgo
        );

        if (recentCount >= maxCodesPerHour) {
            log.warn("⚠️ Rate limit exceeded for: {} [count={}, limit={}]",
                    maskRecipient(recipient), recentCount, maxCodesPerHour);
            throw new RateLimitExceededException(
                    "error.verification.rate.limit",
                    new Object[]{maxCodesPerHour}
            );
        }
    }

    /**
     * ✅ Generate cryptographically secure random code
     */
    private String generateCode() {
        int maxValue = (int) Math.pow(10, codeLength);
        int minValue = maxValue / 10;
        int code = secureRandom.nextInt(maxValue - minValue) + minValue;
        return String.valueOf(code);
    }

    /**
     * ✅ Mask recipient for privacy in logs
     */
    private String maskRecipient(String recipient) {
        if (recipient == null || recipient.length() < 4) {
            return "***";
        }

        if (recipient.contains("@")) {
            String[] parts = recipient.split("@");
            String local = parts[0];
            String domain = parts[1];
            return local.substring(0, Math.min(2, local.length())) + "***@" + domain;
        } else {
            return recipient.substring(0, Math.min(6, recipient.length())) + "***";
        }
    }

    /**
     * ✅ Scheduled cleanup of expired codes
     */
    @Scheduled(cron = "0 0 3 * * ?") // Every day at 3 AM
    @Transactional
    public void cleanupExpiredCodes() {
        log.info("🧹 Starting cleanup of expired verification codes");
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(1);
        int deletedCount = verificationRepository.deleteExpiredCodes(cutoffDate);
        log.info("✅ Cleanup completed: {} expired codes deleted", deletedCount);
    }
}