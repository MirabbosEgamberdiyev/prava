package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.google.GoogleUserInfo;
import uz.pravaimtihon.dto.mapper.UserMapper;
import uz.pravaimtihon.dto.request.*;
import uz.pravaimtihon.dto.response.AuthResponse;
import uz.pravaimtihon.dto.response.UserResponse;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
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
     * вњ… Refresh token with rotation вЂ” revoke old, issue new refresh token.
     * If a revoked token is reused, the entire token family is revoked (security breach).
     */
    public AuthResponse refreshToken(RefreshTokenRequest request, AcceptLanguage language) {
        log.info("Refreshing token [lang={}]", language);
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new UnauthorizedException("error.token.invalid");
        }

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
                            String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails, revokedToken.getTokenFamily());
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
        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails, refreshToken.getTokenFamily());
        String newRefreshTokenStr = UUID.randomUUID().toString();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(newRefreshTokenStr)
                .user(user)
                .tokenFamily(refreshToken.getTokenFamily())
                .expiresAt(LocalDateTime.now().plusDays(30))
                .lastUsedAt(LocalDateTime.now())
                .userAgent(refreshToken.getUserAgent() != null ? refreshToken.getUserAgent() : currentUserAgent())
                .ipAddress(currentClientIp())
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

    /**
     * Foydalanuvchi o'z interfeys tilini saqlaydi (web/desktop til almashtirganda).
     * Faqat preferredLanguage o'zgaradi — boshqa profil maydonlariga tegilmaydi.
     */
    @Transactional
    public UserResponse updateMyLanguage(AcceptLanguage newLanguage) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("error.auth.required");
        }
        User user = userRepository.findById(userId)
                .filter(u -> !u.getDeleted() && u.getIsActive())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));
        user.setPreferredLanguage(newLanguage);
        return userMapper.toResponse(userRepository.save(user), newLanguage);
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

        java.util.Optional<User> byEmail = userRepository.findByEmailAndDeletedFalse(google.getEmail());

        // SECURITY (pre-account hijack): email TASDIQLANMAGAN akkauntga Google hech qachon bog'lanmaydi —
        // aks holda begona odam qurbon emaili bilan oldindan akkaunt ochib, keyin uning Google
        // login'ini o'z akkauntiga "tortib olishi" mumkin edi. Email'ning haqiqiy egasi — Google
        // tasdiqlagan foydalanuvchi, shuning uchun tasdiqlanmagan akkauntdan email ajratiladi.
        if (byEmail.isPresent() && !Boolean.TRUE.equals(byEmail.get().getIsEmailVerified())) {
            User stale = byEmail.get();
            boolean hasOtherLogin = stale.getPhoneNumber() != null || stale.getTelegramId() != null;
            if (hasOtherLogin) {
                log.warn("Detaching unverified email from user {} before Google sign-in", stale.getId());
                stale.setEmail(null);
                userRepository.saveAndFlush(stale);
                byEmail = java.util.Optional.empty();
            } else {
                throw new ConflictException("error.user.email.exists");
            }
        }

        return byEmail
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
        return generateAuthResponse(user, language, currentUserAgent(), currentClientIp());
    }

    /**
     * Tokenlarni aniq qurilma ma'lumotlari bilan yaratadi (masalan QR juftlash: tokenlar tasdiqlagan
     * telefonga emas, tashabbuskor desktop'ga tegishli — B-18). null bo'lsa joriy so'rovdan olinadi.
     */
    public AuthResponse generateAuthResponse(User user, AcceptLanguage language, String userAgent, String ipAddress) {
        String ua = userAgent != null ? truncate(userAgent, 500) : currentUserAgent();
        String ip = ipAddress != null ? truncate(ipAddress, 45) : currentClientIp();
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

        String refreshTokenStr = UUID.randomUUID().toString();
        String tokenFamily = UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails, tokenFamily);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .tokenFamily(tokenFamily)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .lastUsedAt(LocalDateTime.now())
                .userAgent(ua)
                .ipAddress(ip)
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

    private static String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }

    /** Qurilmalar ro'yxatida ko'rsatish uchun (so'rov konteksti bo'lmasa null). */
    private static String currentUserAgent() {
        var attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
            String ua = sra.getRequest().getHeader("User-Agent");
            return ua == null ? null : (ua.length() > 500 ? ua.substring(0, 500) : ua);
        }
        return null;
    }

    private static String currentClientIp() {
        var attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
            String ip = uz.pravaimtihon.security.ClientIpResolver.resolve(sra.getRequest());
            return ip == null ? null : (ip.length() > 45 ? ip.substring(0, 45) : ip);
        }
        return null;
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
}
