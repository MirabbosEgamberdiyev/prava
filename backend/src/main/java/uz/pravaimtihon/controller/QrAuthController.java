package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.exception.UnauthorizedException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.service.QrPairingSessionStore;
import uz.pravaimtihon.service.impl.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/qr")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "QR Device Pairing", description = "Cross-platform Desktop - Web - Mobile pairing protocol")
public class QrAuthController {

    private final QrPairingSessionStore sessionStore;
    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/init")
    @Operation(summary = "Desktop yangi pairing sessiyasini boshlaydi")
    public ResponseEntity<ApiResponse<QrPairingInitResponse>> initPairing(
            @RequestBody(required = false) QrPairingInitRequest request
    ) {
        if (request == null) {
            request = new QrPairingInitRequest();
        }
        QrPairingInitResponse response = sessionStore.createSession(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/status", "/poll"})
    @Operation(summary = "Desktop sessiya holatini so'rab turadi (polling)")
    public ResponseEntity<ApiResponse<QrPairingStatusResponse>> checkStatus(
            @RequestParam("sessionId") String sessionId
    ) {
        QrPairingStatusResponse response = sessionStore.pollStatus(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
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

        User user = userRepository.findById(userId)
                .filter(u -> !u.getDeleted() && u.getIsActive())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Generate full production credentials for the desktop client
        AuthResponse authResponse = authService.generateAuthResponse(user, language);

        boolean approved = sessionStore.approveSession(
                request.getSessionId(),
                request.getChallenge(),
                userId,
                authResponse
        );

        if (!approved) {
            throw new BusinessException("QR sessiyasi muddati o'tgan yoki allaqachon ishlatilgan");
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

    @PostMapping("/cancel")
    @Operation(summary = "Desktop tomoni sessiyani bekor qiladi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelPairing(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(value = "sessionId", required = false) String sessionIdParam
    ) {
        String sessionId = (sessionIdParam != null) ? sessionIdParam : (body != null ? body.get("sessionId") : null);
        if (sessionId != null) {
            sessionStore.cancelSession(sessionId);
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("cancelled", true)));
    }
}
