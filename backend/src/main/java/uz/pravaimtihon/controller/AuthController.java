package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.*;
import uz.pravaimtihon.dto.request.TelegramAuthRequest;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.AuthService;

/**
 * ✅ Autentifikatsiya Controller - To'liq Multi-Language + i18n
 * Barcha endpointlar MessageService orqali xabar qaytaradi.
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "OAuth autentifikatsiya (Google, Telegram), token yangilash va profil")
public class AuthController {

    private final AuthService authService;
    private final MessageService messageService;
    private final uz.pravaimtihon.security.RefreshTokenCookies refreshTokenCookies;

    /** Body'da token bo'lmasa (web cookie rejimi) HttpOnly cookie'dan olinadi. */
    private RefreshTokenRequest withCookieFallback(RefreshTokenRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        RefreshTokenRequest r = request != null ? request : new RefreshTokenRequest();
        if (r.getRefreshToken() == null || r.getRefreshToken().isBlank()) {
            r.setRefreshToken(refreshTokenCookies.read(httpRequest));
        }
        if (r.getRefreshToken() != null && r.getRefreshToken().isBlank()) {
            r.setRefreshToken(null);
        }
        return r;
    }

    @PostMapping("/login")
    @Operation(
            summary = "Xodimlar va foydalanuvchilar uchun login (email/telefon va parol)",
            description = "Email yoki telefon raqami hamda parol orqali tizimga kirish"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Autentifikatsiya muvaffaqiyatli",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AuthResponse.class)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Login yoki parol noto'g'ri",
                    content = @Content(mediaType = "application/json")
            )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        AuthResponse response = authService.login(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.login", language), response));
    }

    @PostMapping("/google")
    @Operation(
            summary = "Google OAuth orqali kirish",
            description = "Google ID Token orqali autentifikatsiya. Yangi foydalanuvchi avtomatik ro'yxatdan o'tkaziladi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Autentifikatsiya muvaffaqiyatli",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Google orqali kirish muvaffaqiyatli",
                                      "data": {
                                        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "tokenType": "Bearer",
                                        "expiresIn": 3600,
                                        "user": {
                                          "id": 1,
                                          "firstName": "Ali",
                                          "lastName": "Valiyev",
                                          "email": "ali@gmail.com",
                                          "role": "USER"
                                        }
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Noto'g'ri Google token",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Google token yaroqsiz yoki muddati o'tgan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Hisob bloklangan yoki faol emas",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Sizning hisobingiz bloklangan. Administrator bilan bog'laning.",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ichki server xatosi yuz berdi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(
            @Valid @RequestBody GoogleAuthRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl")
            AcceptLanguage language
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        messageService.getMessage("success.auth.google", language),
                        authService.googleAuth(request, language)
                )
        );
    }

    @PostMapping("/telegram")
    @Operation(
            summary = "Telegram OAuth orqali kirish",
            description = "Telegram Login Widget orqali autentifikatsiya. Hash HMAC-SHA256 bilan tekshiriladi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Autentifikatsiya muvaffaqiyatli",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Telegram orqali kirish muvaffaqiyatli",
                                      "data": {
                                        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "tokenType": "Bearer",
                                        "expiresIn": 3600,
                                        "user": {
                                          "id": 1,
                                          "firstName": "Ali",
                                          "lastName": "Valiyev",
                                          "telegramId": 123456789,
                                          "role": "USER"
                                        }
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Noto'g'ri Telegram hash yoki muddati o'tgan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Telegram ma'lumotlari yaroqsiz yoki muddati o'tgan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Hisob bloklangan yoki faol emas",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Sizning hisobingiz bloklangan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ichki server xatosi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> telegramAuth(
            @Valid @RequestBody TelegramAuthRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl")
            AcceptLanguage language
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        messageService.getMessage("success.auth.telegram", language),
                        authService.telegramAuth(request, language)
                )
        );
    }

    @PostMapping("/telegram/token-login")
    @Operation(
            summary = "Telegram bot orqali kirish",
            description = "Telegram bot /start orqali olingan one-time token bilan autentifikatsiya."
    )
    public ResponseEntity<ApiResponse<AuthResponse>> telegramTokenLogin(
            @Valid @RequestBody TelegramTokenLoginRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl")
            AcceptLanguage language
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        messageService.getMessage("success.auth.telegram", language),
                        authService.telegramTokenLogin(request.getToken(), language)
                )
        );
    }




    @PostMapping("/refresh")
    @Operation(
            summary = "Token yangilash",
            description = "Refresh token orqali yangi access token olish. Token rotation qo'llaniladi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Token muvaffaqiyatli yangilandi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Token muvaffaqiyatli yangilandi",
                                      "data": {
                                        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "tokenType": "Bearer",
                                        "expiresIn": 3600
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Noto'g'ri yoki muddati o'tgan refresh token",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Refresh token yaroqsiz yoki muddati o'tgan. Qayta kiring.",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ichki server xatosi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        request = withCookieFallback(request, httpRequest);
        AuthResponse response = authService.refreshToken(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.token.refreshed", language), response));
    }

    @PostMapping("/logout")
    @Operation(
            summary = "Tizimdan chiqish",
            description = "Refresh tokenni bekor qiladi. Access token muddati tugaguncha yaroqli."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Muvaffaqiyatli chiqildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Tizimdan muvaffaqiyatli chiqdingiz",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ichki server xatosi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) RefreshTokenRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        request = withCookieFallback(request, httpRequest);
        if (request.getRefreshToken() != null) {
            authService.logout(request.getRefreshToken(), language);
        }
        return ResponseEntity.ok()
                .header(uz.pravaimtihon.security.RefreshTokenCookies.headerName(), refreshTokenCookies.clearHeader())
                .body(ApiResponse.success(messageService.getMessage("success.auth.logout", language), null));
    }


    @GetMapping("/config")
    @Operation(
            summary = "OAuth konfiguratsiyasi",
            description = "Frontend uchun Google va Telegram OAuth sozlamalari"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Konfiguratsiya muvaffaqiyatli olindi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "data": {
                                        "googleClientId": "237372892439-xxx.apps.googleusercontent.com",
                                        "telegramBotUsername": "pravaonlineuzbot",
                                        "googleEnabled": true,
                                        "telegramEnabled": true
                                      }
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<Object>> getOAuthConfig() {
        var config = authService.getOAuthConfig();
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @GetMapping("/me")
    @Operation(
            summary = "Joriy foydalanuvchi",
            description = "Autentifikatsiya qilingan foydalanuvchi profili. JWT token talab qilinadi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Foydalanuvchi ma'lumotlari muvaffaqiyatli olindi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Muvaffaqiyatli",
                                      "data": {
                                        "id": 1,
                                        "firstName": "Ali",
                                        "lastName": "Valiyev",
                                        "phone": "+998901234567",
                                        "email": "ali@example.com",
                                        "telegramId": 123456789,
                                        "googleId": "google-oauth-id",
                                        "profileImageUrl": "/api/v1/files/profiles/avatar.jpg",
                                        "role": "USER",
                                        "isActive": true,
                                        "createdAt": "2024-01-15T10:00:00",
                                        "lastLoginAt": "2024-01-20T15:30:00"
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi - yaroqli JWT token kerak",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Autentifikatsiya talab qilinadi",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ichki server xatosi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserResponse response = authService.getCurrentUser(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/me")
    @Operation(summary = "O'z interfeys tilini saqlash", description = "Body: { \"preferredLanguage\": \"uzl\" | \"uzc\" | \"ru\" | \"en\" }")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyLanguage(
            @RequestBody java.util.Map<String, String> body) {
        String code = body == null ? null : body.get("preferredLanguage");
        if (code == null || !AcceptLanguage.isValid(code)) {
            throw new uz.pravaimtihon.exception.ValidationException("validation.field.required");
        }
        return ResponseEntity.ok(ApiResponse.success(authService.updateMyLanguage(AcceptLanguage.fromCode(code))));
    }
}