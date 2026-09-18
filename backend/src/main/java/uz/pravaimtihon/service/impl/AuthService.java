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
import java.util.List;
import java.util.Optional;
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

        if (request.getPhoneNumber() != null) {
            request.setPhoneNumber(normalizePhone(request.getPhoneNumber()));
        }

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
     * ✅ Step 2 - Verify code and create account with language
     */
    @Transactional
    public AuthResponse completeRegistration(RegisterRequest request, String code, AcceptLanguage language) {
        log.info("Completing registration for: {} [lang={}]", maskIdentifier(request), language);

        validateRegistrationIdentifier(request);

        if (request.getPhoneNumber() != null) {
            request.setPhoneNumber(normalizePhone(request.getPhoneNumber()));
        }

        String recipient = request.getVerificationType().name().equals("SMS")
                ? request.getPhoneNumber()
                : request.getEmail();

        boolean verified = verificationService.verifyCode(recipient, code, request.getVerificationType());
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

        // Canonical phone number
        String phone = request.getPhoneNumber();

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
     * вњ… Login with language
     */
    @Transactional
    public AuthResponse login(LoginRequest request, AcceptLanguage language) {

        // AUDIT: avval to'liq telefon raqami/email log'ga yozilardi (PII).
        // Loglar SUPER_ADMIN uchun API orqali ham o'qiladi
        // (/api/v1/admin/system/logs), shuning uchun maskalanadi.
        log.info("Login attempt for identifier={} [lang={}]",
                maskIdentifierValue(request.getIdentifier()), language);

        // 1️⃣ USER TOPISH (login fail bo‘lishi mumkin)
        String rawIdentifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        String normalizedIdentifier = rawIdentifier;
        if (!rawIdentifier.contains("@")) {
            String cleanPhone = normalizePhone(rawIdentifier);
            if (cleanPhone != null && cleanPhone.length() >= 9) {
                normalizedIdentifier = cleanPhone;
            }
        }

        User user = userRepository.findByIdentifier(normalizedIdentifier)
                .or(() -> userRepository.findByIdentifier(rawIdentifier))
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
                            normalizedIdentifier,
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException ex) {
            try {
                if (!normalizedIdentifier.equals(rawIdentifier)) {
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    rawIdentifier,
                                    request.getPassword()
                            )
                    );
                } else {
                    throw ex;
                }
            } catch (AuthenticationException ex2) {
                // ❌ faqat shu holatda failedAttempt oshadi
                user.incrementFailedLoginAttempts();
                userRepository.save(user);

                log.warn("Authentication failed for userId={}, identifier={}",
                        user.getId(), maskIdentifierValue(request.getIdentifier()));

                throw new UnauthorizedException("error.auth.invalid.credentials");
            }
        }

        // 4пёЏвѓЈ AUTH SUCCESS (BU YERDAN PASTGA вЂ” LOGIN MUVAFFAQIYATLI)
        user.resetFailedLoginAttempts();
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User authenticated successfully: userId={}", user.getId());

        // 5пёЏвѓЈ TOKEN GENERATION (agar shu yerda xato boвЂlsa в†’ 500)
        return generateAuthResponse(user, language);
    }

    /**
     * вњ… Refresh token with rotation вЂ” revoke old, issue new refresh token.
     * If a revoked token is reused, the entire token family is revoked (security breach).
     */
    public AuthResponse refreshToken(RefreshTokenRequest request, AcceptLanguage language) {
        log.info("Refreshing token [lang={}]", language);

        // Check if the token was already revoked (reuse detection with 15s grace window)
        if (refreshTokenRepository.isTokenRevoked(request.getRefreshToken())) {
            Optional<RefreshToken> revokedOpt = refreshTokenRepository.findByToken(request.getRefreshToken());
            if (revokedOpt.isPresent()) {
                RefreshToken revokedToken = revokedOpt.get();
                if (revokedToken.getRevokedAt() != null &&
                        revokedToken.getRevokedAt().isAfter(LocalDateTime.now().minusSeconds(15))) {
                    log.info("Refresh token rotated within 15s grace window for family={}. Returning current active session.",
                            revokedToken.getTokenFamily());
                    List<RefreshToken> activeTokens = refreshTokenRepository.findActiveTokensByFamily(
                            revokedToken.getTokenFamily(), LocalDateTime.now());
                    if (!activeTokens.isEmpty()) {
                        RefreshToken activeToken = activeTokens.get(0);
                        User activeUser = activeToken.getUser();
                        if (Boolean.TRUE.equals(activeUser.getIsActive())) {
                            CustomUserDetails userDetails = CustomUserDetails.from(activeUser);
                            String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);
                            UserResponse userResponse = userMapper.toResponse(activeUser, language);
                            return AuthResponse.builder()
                                    .accessToken(newAccessToken)
                                    .refreshToken(activeToken.getToken())
                                    .tokenType("Bearer")
                                    .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                                    .user(userResponse)
                                    .build();
                        }
                    }
                }
                log.warn("Revoked refresh token reuse detected outside grace window! Revoking entire token family.");
                refreshTokenRepository.revokeAllByFamily(revokedToken.getTokenFamily(), LocalDateTime.now());
            }
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
     * вњ… UPDATED: Logout with language for success message
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
     * вњ… Forgot password with language
     */
    public VerificationSentResponse forgotPassword(ForgotPasswordRequest request, AcceptLanguage language) {
        log.info("Forgot password request for: {} [lang={}]",
                maskIdentifierValue(request.getIdentifier()), language);

        String rawIdentifier = request.getIdentifier() != null ? request.getIdentifier().trim() : "";
        String normalizedIdentifier = rawIdentifier;
        if (!rawIdentifier.contains("@")) {
            String cleanPhone = normalizePhone(rawIdentifier);
            if (cleanPhone != null && cleanPhone.length() >= 9) {
                normalizedIdentifier = cleanPhone;
            }
        }

        Optional<User> maybeUser = userRepository.findByIdentifier(normalizedIdentifier)
                .or(() -> userRepository.findByIdentifier(rawIdentifier));

        if (maybeUser.isPresent()) {
            User user = maybeUser.get();
            String recipient = request.getVerificationType().name().equals("SMS")
                    ? user.getPhoneNumber()
                    : user.getEmail();

            if (recipient != null) {
                return verificationService.sendVerificationCode(
                        recipient,
                        request.getVerificationType(),
                        language
                );
            }
            log.info("Forgot password: tanlangan kanal uchun manzil yo'q, userId={}", user.getId());
        } else {
            log.info("Forgot password: bunday foydalanuvchi yo'q — neytral javob qaytarildi");
        }

        // Neytral (enumeration'ga qarshi) javob — haqiqiy holatni oshkor qilmaydi.
        return VerificationSentResponse.builder()
                .recipient(request.getIdentifier())
                .maskedRecipient(maskIdentifierValue(request.getIdentifier()))
                .expiresInMinutes(10)
                .retryAfterSeconds(60)
                .message(messageService.getMessage("success.verification.sent"))
                .build();
    }

    /**
     * ✅ Reset password with language
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request, AcceptLanguage language) {
        log.info("Reset password request for: {} [lang={}]",
                maskIdentifierValue(request.getRecipient()), language);

        String rawRecipient = request.getRecipient() != null ? request.getRecipient().trim() : "";
        String normalizedRecipient = rawRecipient;
        if (!rawRecipient.contains("@")) {
            String cleanPhone = normalizePhone(rawRecipient);
            if (cleanPhone != null && cleanPhone.length() >= 9) {
                normalizedRecipient = cleanPhone;
            }
        }

        boolean verified = verificationService.verifyCode(
                normalizedRecipient,
                request.getCode(),
                request.getVerificationType()
        ) || verificationService.verifyCode(
                rawRecipient,
                request.getCode(),
                request.getVerificationType()
        );

        if (!verified) {
            throw new BusinessException("error.verification.code.invalid");
        }

        User user = userRepository.findByIdentifier(normalizedRecipient)
                .or(() -> userRepository.findByIdentifier(rawRecipient))
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        validatePasswordStrength(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.resetFailedLoginAttempts();

        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getId(), LocalDateTime.now());

        log.info("Password reset successfully for user: {} [lang={}]", user.getId(), language);
    }

    /**
     * вњ… UPDATED: Change password with language
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
     * вњ… Get current user with language
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

                    String rawFirst = google.getGivenName() != null && !google.getGivenName().isBlank()
                            ? google.getGivenName().trim()
                            : (google.getName() != null && !google.getName().isBlank() ? google.getName().trim() : "Google");
                    if (rawFirst.length() < 2) {
                        rawFirst = rawFirst + " User";
                    }
                    if (rawFirst.length() > 50) {
                        rawFirst = rawFirst.substring(0, 50);
                    }
                    String rawLast = google.getFamilyName() != null && !google.getFamilyName().isBlank()
                            ? google.getFamilyName().trim()
                            : null;
                    if (rawLast != null && rawLast.length() > 50) {
                        rawLast = rawLast.substring(0, 50);
                    }

                    return userRepository.save(User.builder()
                            .googleId(google.getId())
                            .email(google.getEmail())
                            .firstName(rawFirst)
                            .lastName(rawLast)
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

        TelegramTokenStore.TelegramUserData userData = telegramTokenStore.validateAndConsume(token);
        if (userData == null) {
            throw new UnauthorizedException("error.telegram.token.invalid");
        }

        String tgId = String.valueOf(userData.telegramUserId());
        User user = userRepository.findByTelegramIdAndDeletedFalse(tgId)
                .orElseGet(() -> {
                    log.info("Auto-registering Telegram user during token login: tg_id={}", tgId);
                    String rawFirst = (userData.firstName() != null && !userData.firstName().isBlank())
                            ? userData.firstName().trim()
                            : "Telegram";
                    if (rawFirst.length() < 2) {
                        rawFirst = rawFirst + " User";
                    }
                    if (rawFirst.length() > 50) {
                        rawFirst = rawFirst.substring(0, 50);
                    }
                    String rawLast = (userData.lastName() != null && !userData.lastName().isBlank())
                            ? userData.lastName().trim()
                            : null;
                    if (rawLast != null && rawLast.length() > 50) {
                        rawLast = rawLast.substring(0, 50);
                    }
                    String rawUsername = (userData.username() != null && !userData.username().isBlank())
                            ? userData.username().trim()
                            : null;
                    if (rawUsername != null && rawUsername.length() > 100) {
                        rawUsername = rawUsername.substring(0, 100);
                    }

                    return userRepository.save(User.builder()
                            .telegramId(tgId)
                            .telegramUsername(rawUsername)
                            .firstName(rawFirst)
                            .lastName(rawLast)
                            .oauthProvider(OAuthProvider.TELEGRAM)
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.USER)
                            .preferredLanguage(language != null ? language : AcceptLanguage.UZL)
                            .isActive(true)
                            .build());
                });

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

        String rawFirst = (request.getFirstName() != null && !request.getFirstName().isBlank())
                ? request.getFirstName().trim()
                : "Telegram";
        if (rawFirst.length() < 2) {
            rawFirst = rawFirst + " User";
        }
        if (rawFirst.length() > 50) {
            rawFirst = rawFirst.substring(0, 50);
        }
        String rawLast = (request.getLastName() != null && !request.getLastName().isBlank())
                ? request.getLastName().trim()
                : null;
        if (rawLast != null && rawLast.length() > 50) {
            rawLast = rawLast.substring(0, 50);
        }
        String rawUsername = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim()
                : null;
        if (rawUsername != null && rawUsername.length() > 100) {
            rawUsername = rawUsername.substring(0, 100);
        }

        return userRepository.save(User.builder()
                .telegramId(String.valueOf(request.getId()))
                .telegramUsername(rawUsername)
                .firstName(rawFirst)
                .lastName(rawLast)
                .oauthProvider(OAuthProvider.TELEGRAM)
                .profileImageUrl(request.getPhotoUrl())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.USER)
                .preferredLanguage(language)
                .isActive(true)
                .build());
    }

    // ============================================
    // вњ… Helper Methods
    // ============================================

    public AuthResponse generateAuthResponse(User user, AcceptLanguage language) {
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

    public static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 9) {
            return "998" + digits;
        }
        if (digits.length() == 12 && digits.startsWith("998")) {
            return digits;
        }
        return digits;
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new ValidationException("validation.user.password.size");
        }
        if (!password.matches("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) {
            throw new ValidationException("validation.user.password.complexity");
        }
    }

    /** Telefon/email qiymatini log va neytral javoblar uchun maskalaydi. */
    private String maskIdentifierValue(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return "***";
        }
        if (identifier.contains("@")) {
            String[] parts = identifier.split("@", 2);
            String local = parts[0];
            return local.substring(0, Math.min(2, local.length())) + "***@" + parts[1];
        }
        return identifier.substring(0, Math.min(6, identifier.length())) + "***";
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
