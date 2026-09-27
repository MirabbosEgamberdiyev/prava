package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.qr.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.AuthResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.exception.UnauthorizedException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.ClientIpResolver;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.service.QrPairingSessionStore;
import uz.pravaimtihon.service.impl.AuthService;

import java.util.Map;

/**
 * QR orqali qurilma juftlash.
 *
 * <p>pollSecret (B-01): {@code /init} javobidagi {@code pollSecret} {@code /status}, {@code /poll} va
 * {@code /cancel} so'rovlarida {@value #POLL_SECRET_HEADER} sarlavhasida yuboriladi. O'tish davrida
 * ({@code app.qr.allow-legacy-poll=true}) sarlavhasiz poll ham qabul qilinadi.
 */
@RestController
@RequestMapping("/api/v1/auth/qr")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "QR Device Pairing", description = "Cross-platform Desktop - Web - Mobile pairing protocol")
public class QrAuthController {

    public static final String POLL_SECRET_HEADER = "X-QR-Poll-Secret";

    private final QrPairingSessionStore sessionStore;
    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/init")
    @Operation(summary = "Desktop yangi pairing sessiyasini boshlaydi (javobda pollSecret — faqat desktop uchun)")
    public ResponseEntity<ApiResponse<QrPairingInitResponse>> initPairing(
            @RequestBody(required = false) QrPairingInitRequest request,
            HttpServletRequest httpRequest
    ) {
        if (request == null) {
            request = new QrPairingInitRequest();
        }
        QrPairingInitResponse response = sessionStore.createSession(request,
                ClientIpResolver.resolve(httpRequest), httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/status", "/poll"})
    @Operation(summary = "Desktop sessiya holatini so'rab turadi (polling). Sarlavha: X-QR-Poll-Secret")
    public ResponseEntity<ApiResponse<QrPairingStatusResponse>> checkStatus(
            @RequestParam("sessionId") String sessionId,
            @RequestHeader(value = POLL_SECRET_HEADER, required = false) String pollSecret
    ) {
        QrPairingSessionStore.PollOutcome outcome;
        try {
            outcome = sessionStore.poll(sessionId, pollSecret);
        } catch (QrPairingSessionStore.PollSecretException e) {
            throw new ForbiddenException("error.qr.poll.secret.invalid");
        }

        if (!outcome.approved()) {
            return ResponseEntity.ok(ApiResponse.success(QrPairingStatusResponse.builder()
                    .status(outcome.status().name())
                    .build()));
        }

        // B-13/B-18: tokenlar iste'mol paytida, tashabbuskor (desktop) qurilma ma'lumotlari bilan yaratiladi.
        User user = outcome.userId() == null ? null : userRepository.findById(outcome.userId())
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()) && Boolean.TRUE.equals(u.getIsActive()))
                .orElse(null);
        if (user == null) {
            log.warn("QR session {} approved by a user that is no longer active — pairing rejected", sessionId);
            return ResponseEntity.ok(ApiResponse.success(QrPairingStatusResponse.builder()
                    .status(QrPairingSessionStore.Status.REJECTED.name())
                    .build()));
        }

        AuthResponse auth = authService.generateAuthResponse(user,
                outcome.language() != null ? outcome.language() : AcceptLanguage.UZL,
                outcome.initUserAgent(), outcome.initIp());

        log.info("QR pairing tokens issued to initiator for session {} (userId={})", sessionId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(QrPairingStatusResponse.builder()
                .status("APPROVED")
                .accessToken(auth.getAccessToken())
                .refreshToken(auth.getRefreshToken())
                .expiresIn(auth.getExpiresIn())
                .user(auth.getUser())
                .build()));
    }

    @GetMapping("/session-info")
    @Operation(summary = "Mobil brauzer QR skanerlanganda desktop ma'lumotlarini oladi")
    public ResponseEntity<ApiResponse<QrPairingSessionInfoResponse>> getSessionInfo(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("challenge") String challenge
    ) {
        QrPairingSessionInfoResponse info = sessionStore.getSessionInfo(sessionId, challenge);
        if (info == null) {
            throw new ResourceNotFoundException("error.qr.session.invalid");
        }
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    @PostMapping("/approve")
    @Operation(summary = "Telefonda autentifikatsiyadan o'tgan user desktop ulanishini tasdiqlaydi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approvePairing(
            @Valid @RequestBody QrPairingApproveRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language
    ) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new UnauthorizedException("error.auth.required");
        }

        userRepository.findById(userId)
                .filter(u -> !u.getDeleted() && u.getIsActive())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Tokenlar bu yerda yaratilmaydi (B-13): desktop poll qilganda, uning qurilmasi uchun yaratiladi.
        boolean approved = sessionStore.approveSession(
                request.getSessionId(),
                request.getChallenge(),
                userId,
                language
        );

        if (!approved) {
            throw new BusinessException("error.qr.session.invalid");
        }

        return ResponseEntity.ok(ApiResponse.success("Qurilma muvaffaqiyatli ulandi", Map.of(
                "success", true,
                "paired", true,
                "deviceName", "PRAVA Desktop"
        )));
    }

    @PostMapping("/reject")
    @Operation(summary = "Foydalanuvchi ulanishni bekor qiladi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectPairing(
            @RequestBody(required = false) QrPairingApproveRequest request,
            @RequestParam(value = "sessionId", required = false) String sessionIdParam,
            @RequestParam(value = "challenge", required = false) String challengeParam
    ) {
        String sessionId = (request != null && request.getSessionId() != null) ? request.getSessionId() : sessionIdParam;
        String challenge = (request != null && request.getChallenge() != null) ? request.getChallenge() : challengeParam;
        if (sessionId == null || challenge == null) {
            throw new BusinessException("sessionId va challenge talab qilinadi");
        }
        boolean rejected = sessionStore.rejectSession(sessionId, challenge);
        return ResponseEntity.ok(ApiResponse.success(Map.of("rejected", rejected)));
    }

    /**
     * Desktop sessiyani bekor qiladi. B-01: {@code challenge} (body/query) YOKI pollSecret
     * ({@value #POLL_SECRET_HEADER} sarlavhasi yoki body'dagi {@code pollSecret}) talab qilinadi.
     * Javob shakli o'zgarmagan; tasdiqlanmasa {@code cancelled:false}.
     */
    @PostMapping("/cancel")
    @Operation(summary = "Desktop tomoni sessiyani bekor qiladi (challenge yoki X-QR-Poll-Secret kerak)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelPairing(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(value = "sessionId", required = false) String sessionIdParam,
            @RequestParam(value = "challenge", required = false) String challengeParam,
            @RequestHeader(value = POLL_SECRET_HEADER, required = false) String pollSecretHeader
    ) {
        String sessionId = (sessionIdParam != null) ? sessionIdParam : (body != null ? body.get("sessionId") : null);
        String challenge = (challengeParam != null) ? challengeParam : (body != null ? body.get("challenge") : null);
        String pollSecret = (pollSecretHeader != null) ? pollSecretHeader : (body != null ? body.get("pollSecret") : null);
        boolean cancelled = sessionId != null && sessionStore.cancelSession(sessionId, challenge, pollSecret);
        return ResponseEntity.ok(ApiResponse.success(Map.of("cancelled", cancelled)));
    }
}
