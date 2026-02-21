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
@Tag(name = "Authentication", description = "Ro'yxatdan o'tish, kirish, token yangilash, parol tiklash")
public class AuthController {

    private final AuthService authService;
    private final MessageService messageService;

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

    @PostMapping("/register/init")
    @Operation(
            summary = "Ro'yxatdan o'tish - 1-qadam",
            description = "SMS/Email orqali tasdiqlash kodi yuborish. Kod 5 daqiqa yaroqli."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tasdiqlash kodi muvaffaqiyatli yuborildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Tasdiqlash kodi yuborildi",
                                      "data": {
                                        "identifier": "+998901234567",
                                        "expiresAt": "2024-01-15T10:30:00",
                                        "testCode": "123456"
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Telefon raqami yoki email allaqachon ro'yxatdan o'tgan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Bu telefon raqami allaqachon ro'yxatdan o'tgan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Validatsiya xatosi - noto'g'ri telefon/email formati",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Validatsiya xatosi",
                                      "errors": {
                                        "phone": "Telefon raqami formati noto'g'ri. Namuna: +998901234567"
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "SMS/Email yuborishda xatolik",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "SMS yuborishda xatolik yuz berdi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<VerificationSentResponse>> initiateRegistration(
            @Valid @RequestBody RegisterRequest request,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        VerificationSentResponse response = authService.initiateRegistration(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.verification.sent", language), response));
    }

    @PostMapping("/register/complete")
    @Operation(
            summary = "Ro'yxatdan o'tish - 2-qadam",
            description = "Tasdiqlash kodini tekshirish va hisobni yaratish. JWT tokenlar qaytariladi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Ro'yxatdan o'tish muvaffaqiyatli",
                                      "data": {
                                        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "tokenType": "Bearer",
                                        "expiresIn": 3600,
                                        "user": {
                                          "id": 1,
                                          "firstName": "Ali",
                                          "lastName": "Valiyev",
                                          "phone": "+998901234567",
                                          "role": "USER"
                                        }
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri yoki muddati o'tgan tasdiqlash kodi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Tasdiqlash kodi noto'g'ri yoki muddati o'tgan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "409",
                    description = "Telefon raqami yoki email allaqachon ro'yxatdan o'tgan",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Bu telefon raqami allaqachon ro'yxatdan o'tgan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Validatsiya xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Validatsiya xatosi",
                                      "errors": {
                                        "password": "Parol kamida 8 belgidan iborat bo'lishi kerak"
                                      }
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
    public ResponseEntity<ApiResponse<AuthResponse>> completeRegistration(
            @Valid @RequestBody RegisterRequest request,
            @RequestParam String code,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        AuthResponse response = authService.completeRegistration(request, code, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.auth.registration", language), response));
    }

    @PostMapping("/login")
    @Operation(
            summary = "Tizimga kirish",
            description = "Telefon/email va parol bilan kirish. 5 marta noto'g'ri urinishda hisob bloklanadi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Kirish muvaffaqiyatli",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Kirish muvaffaqiyatli",
                                      "data": {
                                        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        "tokenType": "Bearer",
                                        "expiresIn": 3600,
                                        "user": {
                                          "id": 1,
                                          "firstName": "Ali",
                                          "lastName": "Valiyev",
                                          "phone": "+998901234567",
                                          "email": "ali@example.com",
                                          "role": "USER",
                                          "isActive": true
                                        }
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Noto'g'ri login yoki parol",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Telefon raqami yoki parol noto'g'ri",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Hisob bloklangan - ko'p noto'g'ri urinishlar",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Hisob vaqtincha bloklangan. 15 daqiqadan keyin qayta urinib ko'ring.",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Validatsiya xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Validatsiya xatosi",
                                      "errors": {
                                        "identifier": "Telefon raqami yoki email kiritish majburiy"
                                      }
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
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        AuthResponse response = authService.login(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.login", language), response));
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
            @Valid @RequestBody RefreshTokenRequest request,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

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
            @RequestParam String refreshToken,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        authService.logout(refreshToken, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.logout", language), null));
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Parolni tiklash so'rovi",
            description = "SMS/Email orqali parolni tiklash kodi yuboriladi. Kod 5 daqiqa yaroqli."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tiklash kodi yuborildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Parolni tiklash kodi yuborildi",
                                      "data": {
                                        "identifier": "+998901234567",
                                        "expiresAt": "2024-01-15T10:30:00",
                                        "testCode": "654321"
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Foydalanuvchi topilmadi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Bu telefon raqami bilan foydalanuvchi topilmadi",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "SMS/Email yuborishda xatolik",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "SMS yuborishda xatolik",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<VerificationSentResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        VerificationSentResponse response = authService.forgotPassword(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.reset.code.sent", language), response));
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Parolni tiklash",
            description = "Tasdiqlash kodi orqali yangi parol o'rnatish. Barcha sessiyalar tugatiladi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Parol muvaffaqiyatli tiklandi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Parol muvaffaqiyatli tiklandi. Endi yangi parol bilan kirishingiz mumkin.",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri yoki muddati o'tgan kod",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Tasdiqlash kodi noto'g'ri yoki muddati o'tgan",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Parol validatsiya xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Validatsiya xatosi",
                                      "errors": {
                                        "newPassword": "Parol kamida 8 belgidan iborat bo'lishi kerak"
                                      }
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
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        authService.resetPassword(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.password.reset", language), null));
    }

    @PostMapping("/change-password")
    @Operation(
            summary = "Parolni o'zgartirish",
            description = "Joriy parolni tekshirib yangi parol o'rnatish. JWT token talab qilinadi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Parol muvaffaqiyatli o'zgartirildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Parol muvaffaqiyatli o'zgartirildi",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Joriy parol noto'g'ri",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Joriy parol noto'g'ri",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi",
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
                    responseCode = "422",
                    description = "Yangi parol validatsiya xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Validatsiya xatosi",
                                      "errors": {
                                        "newPassword": "Yangi parol joriy paroldan farq qilishi kerak"
                                      }
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
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @Parameter(description = "Accept-Language", required = true)
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        authService.changePassword(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.auth.password.changed", language), null));
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
}