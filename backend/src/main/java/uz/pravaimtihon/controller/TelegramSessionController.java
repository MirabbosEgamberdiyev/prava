package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.AuthResponse;
import uz.pravaimtihon.dto.telegram.TelegramSessionInitRequest;
import uz.pravaimtihon.dto.telegram.TelegramSessionInitResponse;
import uz.pravaimtihon.dto.telegram.TelegramSessionStatusResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.ClientIpResolver;
import uz.pravaimtihon.service.TelegramAuthSessionStore;
import uz.pravaimtihon.service.impl.AuthService;

import java.util.Map;

/**
 * Telegram orqali "bir bosishda" kirish (Web, Desktop, Mobile uchun yagona oqim).
 *
 * <ol>
 *   <li>{@code POST /init} — klient {@code token}, {@code pollSecret}, {@code directAppUrl} (tg://) va
 *       {@code botUrl} (https://t.me) oladi va Telegram'ni ochadi.</li>
 *   <li>Botda foydalanuvchi qurilma ma'lumotini ko'radi va "Tasdiqlash"ni bosadi.</li>
 *   <li>{@code GET /status?token=...} ({@value QrAuthController#POLL_SECRET_HEADER} sarlavhasi bilan) —
 *       APPROVED bo'lsa tokenlar faqat bir marta, tashabbuskor qurilma ma'lumotlari bilan beriladi.</li>
 * </ol>
 * Sarlavha nomi QR oqimi bilan bir xil — u CORS ro'yxatida bor, yangi sarlavha qo'shilmaydi.
 */
@RestController
@RequestMapping("/api/v1/auth/telegram/session")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Telegram Session Login", description = "Deep-link + bot confirmation login for Web / Desktop / Mobile")
public class TelegramSessionController {

    private final TelegramAuthSessionStore sessionStore;
    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/init")
    @Operation(summary = "Telegram login sessiyasini boshlaydi (javobda pollSecret — faqat tashabbuskor uchun)")
    public ResponseEntity<ApiResponse<TelegramSessionInitResponse>> init(
            @RequestBody(required = false) TelegramSessionInitRequest request,
            HttpServletRequest httpRequest) {
        try {
            TelegramSessionInitResponse response = sessionStore.createSession(request,
                    ClientIpResolver.resolve(httpRequest), httpRequest.getHeader("User-Agent"));
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (TelegramAuthSessionStore.CapacityException e) {
            throw new RateLimitExceededException("Juda ko'p so'rov, birozdan keyin urinib ko'ring");
        }
    }

    @GetMapping("/status")
    @Operation(summary = "Sessiya holatini so'raydi (polling). Sarlavha: X-QR-Poll-Secret")
    public ResponseEntity<ApiResponse<TelegramSessionStatusResponse>> status(
            @RequestParam("token") String token,
            @RequestHeader(value = QrAuthController.POLL_SECRET_HEADER, required = false) String pollSecret) {

        TelegramAuthSessionStore.PollOutcome outcome;
        try {
            outcome = sessionStore.poll(token, pollSecret);
        } catch (TelegramAuthSessionStore.PollSecretException e) {
            throw new ForbiddenException("error.qr.poll.secret.invalid");
        }

        if (!outcome.approved()) {
            return ResponseEntity.ok(ApiResponse.success(TelegramSessionStatusResponse.builder()
                    .status(outcome.status().name())
                    .build()));
        }

        User user = outcome.userId() == null ? null : userRepository.findById(outcome.userId())
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()) && Boolean.TRUE.equals(u.getIsActive()))
                .orElse(null);
        if (user == null) {
            log.warn("Telegram session approved for a user that is no longer active — login refused");
            return ResponseEntity.ok(ApiResponse.success(TelegramSessionStatusResponse.builder()
                    .status(TelegramAuthSessionStore.Status.REJECTED.name())
                    .build()));
        }

        AuthResponse auth = authService.generateAuthResponse(user,
                outcome.language() != null ? outcome.language() : AcceptLanguage.UZL,
                outcome.userAgent(), outcome.clientIp());

        log.info("Telegram session tokens issued to initiator (userId={})", user.getId());
        return ResponseEntity.ok(ApiResponse.success(TelegramSessionStatusResponse.builder()
                .status("APPROVED")
                .accessToken(auth.getAccessToken())
                .refreshToken(auth.getRefreshToken())
                .expiresIn(auth.getExpiresIn())
                .user(auth.getUser())
                .redirectPath(outcome.redirectPath())
                .build()));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Tashabbuskor sessiyani bekor qiladi (X-QR-Poll-Secret kerak)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @RequestParam("token") String token,
            @RequestHeader(value = QrAuthController.POLL_SECRET_HEADER, required = false) String pollSecret) {
        boolean cancelled;
        try {
            cancelled = sessionStore.cancel(token, pollSecret);
        } catch (TelegramAuthSessionStore.PollSecretException e) {
            throw new ForbiddenException("error.qr.poll.secret.invalid");
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("cancelled", cancelled)));
    }
}
