package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.google.GoogleUserInfo;
import uz.pravaimtihon.dto.mapper.UserMapper;
import uz.pravaimtihon.dto.request.*;
import uz.pravaimtihon.dto.response.AuthResponse;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.dto.response.VerificationSentResponse;
import uz.pravaimtihon.entity.RefreshToken;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.OAuthProvider;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.exception.*;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.CustomUserDetails;
import uz.pravaimtihon.security.JwtTokenProvider;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.service.DeviceManagementService;
import uz.pravaimtihon.service.GoogleOAuthService;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.TelegramAuthService;
import uz.pravaimtihon.service.TelegramTokenStore;
import uz.pravaimtihon.service.VerificationService;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final VerificationService verificationService;
    private final UserMapper userMapper;
    private final MessageService messageService;
    private final GoogleOAuthService googleOAuthService;
    private final TelegramAuthService telegramAuthService;
    private final TelegramTokenStore telegramTokenStore;
    private final DeviceManagementService deviceManagementService;

    @Value("${app.oauth.google.auto-register:true}")
    private boolean autoRegister;

    @Value("${app.oauth.google.enabled:true}")
    private boolean googleEnabled;

    @Value("${app.oauth.telegram.enabled:true}")
    private boolean telegramEnabled;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.telegram.bot-username:pravaonlineuzbot}")
    private String telegramBotUsername;

    /**
     * Get OAuth configuration for frontend
     */
    public Object getOAuthConfig() {
        return java.util.Map.of(
                "googleClientId", googleClientId != null ? googleClientId : "",
                "telegramBotUsername", telegramBotUsername != null ? telegramBotUsername : "",
                "googleEnabled", googleEnabled,
                "telegramEnabled", telegramEnabled
        );
    }

    /**
     * ✅ Step 1 - Send verification code with language
     */
    public VerificationSentResponse initiateRegistration(RegisterRequest request, AcceptLanguage language) {
        log.info("Initiating registration for: {} [lang={}]", maskIdentifier(request), language);

        validateRegistrationIdentifier(request);

        String identifier = getIdentifier(request);
        if (userRepository.findByIdentifier(identifier).isPresent()) {
            throw new ConflictException(
                    request.getPhoneNumber() != null
                            ? "error.user.phone.exists"
                            : "error.user.email.exists"
            );
        }

        validatePasswordStrength(request.getPassword());

        String recipient = request.getVerificationType().name().equals("SMS")
                ? request.getPhoneNumber()
                : request.getEmail();

        return verificationService.sendVerificationCode(
                recipient,
                request.getVerificationType(),
                language
        );
    }

    /**
     * ✅ Step 2 - Complete registration with language
     */
    public AuthResponse completeRegistration(RegisterRequest request, String code, AcceptLanguage language) {
        log.info("Completing registration for: {} [lang={}]", maskIdentifier(request), language);

        String recipient = request.getVerificationType().name().equals("SMS")
                ? request.getPhoneNumber()
                : request.getEmail();

        boolean verified = verificationService.verifyCode(
                recipient,
                code,
                request.getVerificationType()
        );

        if (!verified) {
            throw new BusinessException("error.verification.code.invalid");
        }

        String identifier = getIdentifier(request);
        if (userRepository.findByIdentifier(identifier).isPresent()) {
            throw new ConflictException(
                    request.getPhoneNumber() != null
                            ? "error.user.phone.exists"
                            : "error.user.email.exists"
            );
        }

        // Normalize phone number - strip + prefix
        String phone = request.getPhoneNumber();
        if (phone != null && phone.startsWith("+")) {
            phone = phone.substring(1);
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(phone)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .preferredLanguage(request.getPreferredLanguage())
                .isActive(true)
                .isEmailVerified(request.getEmail() != null)
                .isPhoneVerified(phone != null)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getId());

        return generateAuthResponse(user, language);
    }

    /**
     * ✅ Login with language
     */
    @Transactional
    public AuthResponse login(LoginRequest request, AcceptLanguage language) {

        log.info("Login attempt for identifier={} [lang={}]", request.getIdentifier(), language);

        // 1️⃣ USER TOPISH (login fail bo‘lishi mumkin)
        User user = userRepository.findByIdentifier(request.getIdentifier())
                .orElseThrow(() -> new UnauthorizedException("error.auth.invalid.credentials"));

        // 2️⃣ BUSINESS CHECKS
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("error.user.account.inactive");
        }

        if (user.isAccountLocked()) {
            throw new UnauthorizedException("error.user.account.locked");
        }

        // 3️⃣ AUTHENTICATION (FAFAQAT SHU JOY LOGIN FAIL QILADI)
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getIdentifier(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException ex) {

            // ❗ faqat shu holatda failedAttempt oshadi
            user.incrementFailedLoginAttempts();
            userRepository.save(user);

            log.warn("Authentication failed for userId={}, identifier={}",
                    user.getId(), request.getIdentifier());

            throw new UnauthorizedException("error.auth.invalid.credentials");
        }

        // 4️⃣ AUTH SUCCESS (BU YERDAN PASTGA — LOGIN MUVAFFAQIYATLI)
        user.resetFailedLoginAttempts();
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User authenticated successfully: userId={}", user.getId());

        // 5️⃣ TOKEN GENERATION (agar shu yerda xato bo‘lsa → 500)
        return generateAuthResponse(user, language);
    }

    /**
     * ✅ Refresh token with rotation — revoke old, issue new refresh token.
     * If a revoked token is reused, the entire token family is revoked (security breach).
     */
    public AuthResponse refreshToken(RefreshTokenRequest request, AcceptLanguage language) {
        log.info("Refreshing token [lang={}]", language);

        // Check if the token was already revoked (reuse detection)
        if (refreshTokenRepository.isTokenRevoked(request.getRefreshToken())) {
            log.warn("Revoked refresh token reuse detected! Revoking entire token family.");
            refreshTokenRepository.findByToken(request.getRefreshToken())
                    .ifPresent(revokedToken -> refreshTokenRepository.revokeAllByFamily(
                            revokedToken.getTokenFamily(), LocalDateTime.now()));
            throw new UnauthorizedException("error.token.invalid");
        }

        RefreshToken refreshToken = refreshTokenRepository
                .findValidToken(request.getRefreshToken(), LocalDateTime.now())
                .orElseThrow(() -> new UnauthorizedException("error.token.invalid"));

        User user = refreshToken.getUser();

        if (!user.getIsActive()) {
            throw new UnauthorizedException("error.user.account.inactive");
        }

        // Revoke old refresh token
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        // Generate new refresh token in the same family
        CustomUserDetails userDetails = CustomUserDetails.from(user);
        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String newRefreshTokenStr = UUID.randomUUID().toString();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(newRefreshTokenStr)
                .user(user)
                .tokenFamily(refreshToken.getTokenFamily())
                .expiresAt(LocalDateTime.now().plusDays(30))
                .lastUsedAt(LocalDateTime.now())
                .build();

        refreshTokenRepository.save(newRefreshToken);

        UserResponse userResponse = userMapper.toResponse(user, language);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .user(userResponse)
                .build();
    }

    /**
     * ✅ UPDATED: Logout with language for success message
     */
    public void logout(String refreshTokenStr, AcceptLanguage language) {
        log.info("Logging out user [lang={}]", language);

        refreshTokenRepository.findByToken(refreshTokenStr)
                .ifPresent(token -> {
                    token.revoke();
                    refreshTokenRepository.save(token);
                    // Unregister device on logout
                    try {
                        deviceManagementService.unregisterDevice(token.getUser().getId());
                    } catch (Exception e) {
                        log.warn("Device unregister error: {}", e.getMessage());
                    }
                    log.info("User logged out: {}", token.getUser().getId());
                });
    }

    /**
     * ✅ Forgot password with language
     */
    public VerificationSentResponse forgotPassword(ForgotPasswordRequest request, AcceptLanguage language) {
        log.info("Forgot password request for: {} [lang={}]", request.getIdentifier(), language);

        User user = userRepository.findByIdentifier(request.getIdentifier())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        String recipient = request.getVerificationType().name().equals("SMS")
                ? user.getPhoneNumber()
                : user.getEmail();

        if (recipient == null) {
            throw new BusinessException("error.verification.method.unavailable");
        }

        return verificationService.sendVerificationCode(
                recipient,
                request.getVerificationType(),
                language
        );
    }

    /**
     * ✅ UPDATED: Reset password with language
     */
    public void resetPassword(ResetPasswordRequest request, AcceptLanguage language) {
        log.info("Resetting password for: {} [lang={}]", request.getRecipient(), language);

        boolean verified = verificationService.verifyCode(
                request.getRecipient(),
                request.getCode(),
                request.getVerificationType()
        );

        if (!verified) {
            throw new BusinessException("error.verification.code.invalid");
        }

        User user = userRepository.findByIdentifier(request.getRecipient())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        validatePasswordStrength(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.resetFailedLoginAttempts();

        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getId(), LocalDateTime.now());

        log.info("Password reset successfully for user: {} [lang={}]", user.getId(), language);
    }

    /**
     * ✅ UPDATED: Change password with language
     */
    public void changePassword(ChangePasswordRequest request, AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("error.auth.required");
        }

        log.info("Changing password for user: {} [lang={}]", userId, language);

        User user = userRepository.findById(userId)
                .filter(u -> !u.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("error.password.current.invalid");
        }

        validatePasswordStrength(request.getNewPassword());

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BusinessException("error.password.same.as.current");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user: {} [lang={}]", userId, language);
    }

    /**
     * ✅ Get current user with language
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("error.auth.required");
        }

        User user = userRepository.findById(userId)
                .filter(u -> !u.getDeleted() && u.getIsActive())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        return userMapper.toResponse(user, language);
    }

    @Transactional
    public AuthResponse googleAuth(GoogleAuthRequest request, AcceptLanguage language) {

        GoogleUserInfo google;
        if (request.getAccessToken() != null && !request.getAccessToken().isBlank()) {
            google = googleOAuthService.verifyAccessToken(request.getAccessToken());
        } else if (request.getIdToken() != null && !request.getIdToken().isBlank()) {
            google = googleOAuthService.verifyToken(request.getIdToken());
        } else {
            throw new BusinessException("error.google.token.invalid");
        }

        if (google.getEmail() == null || !Boolean.TRUE.equals(google.getEmailVerified())) {
            throw new BusinessException("error.google.email.not.verified");
        }

        User user = userRepository.findByGoogleIdAndDeletedFalse(google.getId())
                .orElseGet(() -> linkOrCreateGoogleUser(google, language));

        if (!user.getIsActive() || user.isAccountLocked()) {
            throw new BusinessException("error.user.account.inactive");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.resetFailedLoginAttempts();
        userRepository.save(user);

        return generateAuthResponse(user, language);
    }
    private User linkOrCreateGoogleUser(GoogleUserInfo google, AcceptLanguage language) {

        return userRepository.findByEmailAndDeletedFalse(google.getEmail())
                .map(existing -> {
                    existing.setGoogleId(google.getId());
                    existing.setOauthProvider(OAuthProvider.GOOGLE);
                    existing.setProfileImageUrl(google.getPicture());
                    existing.setIsEmailVerified(true);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    if (!autoRegister) {
                        throw new BusinessException("error.google.auto.register.disabled");
                    }

                    return userRepository.save(User.builder()
                            .googleId(google.getId())
                            .email(google.getEmail())
                            .firstName(google.getGivenName() != null
                                    ? google.getGivenName()
                                    : google.getName())
                            .lastName(google.getFamilyName())
                            .oauthProvider(OAuthProvider.GOOGLE)
                            .profileImageUrl(google.getPicture())
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.USER)
                            .preferredLanguage(language)
                            .isEmailVerified(true)
                            .isActive(true)
                            .build());
                });
    }

    /**
     * Telegram Login Widget authentication
     */
    @Transactional
    public AuthResponse telegramAuth(TelegramAuthRequest request, AcceptLanguage language) {
        log.info("Telegram auth attempt for user_id={}, username={}", request.getId(), request.getUsername());

        // Verify Telegram auth data (HMAC-SHA256 verification)
        telegramAuthService.verifyAuthData(request);

        String telegramId = String.valueOf(request.getId());

        // Find existing user by Telegram ID or link/create
        User user = userRepository.findByTelegramIdAndDeletedFalse(telegramId)
                .orElseGet(() -> linkOrCreateTelegramUser(request, language));

        if (!user.getIsActive() || user.isAccountLocked()) {
            throw new BusinessException("error.user.account.inactive");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.resetFailedLoginAttempts();
        userRepository.save(user);

        log.info("Telegram auth successful for user_id={}", user.getId());
        return generateAuthResponse(user, language);
    }

    /**
     * Telegram one-time token login (from bot /start command)
     */
    @Transactional
    public AuthResponse telegramTokenLogin(String token, AcceptLanguage language) {
        log.info("Telegram token login attempt");

        Long telegramUserId = telegramTokenStore.validateAndConsume(token);
        if (telegramUserId == null) {
            throw new UnauthorizedException("error.telegram.token.invalid");
        }

        String tgId = String.valueOf(telegramUserId);
        User user = userRepository.findByTelegramIdAndDeletedFalse(tgId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        if (!user.getIsActive() || user.isAccountLocked()) {
            throw new BusinessException("error.user.account.inactive");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.resetFailedLoginAttempts();
        userRepository.save(user);

        log.info("Telegram token login successful for user_id={}", user.getId());
        return generateAuthResponse(user, language);
    }

    /**
     * Link Telegram account to existing user or create new user.
     * Attempts to link if a user with matching phone number exists.
     */
    private User linkOrCreateTelegramUser(TelegramAuthRequest request, AcceptLanguage language) {
        String telegramId = String.valueOf(request.getId());

        // Try to find existing user by phone number if username looks like a phone
        // Telegram usernames can sometimes be phone numbers
        if (request.getUsername() != null && request.getUsername().matches("^998[0-9]{9}$")) {
            return userRepository.findByPhoneNumberAndDeletedFalse(request.getUsername())
                    .map(existing -> {
                        log.info("Linking Telegram account to existing user by phone: userId={}", existing.getId());
                        existing.setTelegramId(telegramId);
                        existing.setTelegramUsername(request.getUsername());
                        existing.setOauthProvider(OAuthProvider.TELEGRAM);
                        if (existing.getProfileImageUrl() == null && request.getPhotoUrl() != null) {
                            existing.setProfileImageUrl(request.getPhotoUrl());
                        }
                        return userRepository.save(existing);
                    })
                    .orElseGet(() -> createNewTelegramUser(request, language));
        }

        return createNewTelegramUser(request, language);
    }

    /**
     * Create a new user from Telegram data.
     */
    private User createNewTelegramUser(TelegramAuthRequest request, AcceptLanguage language) {
        log.info("Creating new user from Telegram: telegram_id={}", request.getId());

        return userRepository.save(User.builder()
                .telegramId(String.valueOf(request.getId()))
                .telegramUsername(request.getUsername())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .oauthProvider(OAuthProvider.TELEGRAM)
                .profileImageUrl(request.getPhotoUrl())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.USER)
                .preferredLanguage(language)
                .isActive(true)
                .build());
    }

    // ============================================
    // ✅ Helper Methods
    // ============================================

    private AuthResponse generateAuthResponse(User user, AcceptLanguage language) {
        // Device limit enforcement: if limit reached, remove oldest session
        try {
            if (!deviceManagementService.canAddNewDevice(user.getId())) {
                log.info("Device limit reached for user {}. Removing oldest session.", user.getId());
            }
            deviceManagementService.registerNewDevice(user.getId());
        } catch (Exception e) {
            log.warn("Device management error for user {}: {}", user.getId(), e.getMessage());
        }

        CustomUserDetails userDetails = CustomUserDetails.from(user);

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshTokenStr = UUID.randomUUID().toString();
        String tokenFamily = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .tokenFamily(tokenFamily)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .lastUsedAt(LocalDateTime.now())
                .build();

        refreshTokenRepository.save(refreshToken);

        UserResponse userResponse = userMapper.toResponse(user, language);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .user(userResponse)
                .build();
    }

    private void validateRegistrationIdentifier(RegisterRequest request) {
        if ((request.getPhoneNumber() == null || request.getPhoneNumber().isBlank()) &&
                (request.getEmail() == null || request.getEmail().isBlank())) {
            throw new ValidationException("validation.verification.recipient.required");
        }
    }

    private String getIdentifier(RegisterRequest request) {
        return request.getPhoneNumber() != null
                ? request.getPhoneNumber()
                : request.getEmail();
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 6) {
            throw new ValidationException("validation.user.password.size");
        }
    }

    private String maskIdentifier(RegisterRequest request) {
        if (request.getPhoneNumber() != null) {
            return request.getPhoneNumber().substring(0, 6) + "***";
        }
        if (request.getEmail() != null) {
            String[] parts = request.getEmail().split("@");
            return parts[0].substring(0, 2) + "***@" + parts[1];
        }
        return "unknown";
    }
}