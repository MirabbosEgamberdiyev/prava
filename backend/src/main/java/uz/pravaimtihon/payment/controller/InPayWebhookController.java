package uz.pravaimtihon.payment.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.payment.service.InPayService;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Webhook controller for inPAY.uz.
 *
 * Receives notifications from inPAY when a payment succeeds or fails.
 * Covered by isolated security filter chain in {@link uz.pravaimtihon.payment.config.PaymentSecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1/payment/inpay")
@RequiredArgsConstructor
@Slf4j
public class InPayWebhookController {

    private final InPayService inPayService;

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "X-InPAY-Signature", required = false) String signature,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody(required = false) byte[] rawBody,
            HttpServletRequest request) {

        String clientIp = resolveClientIp(request);
        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        String rawBodyStr = rawBody != null ? new String(rawBody, StandardCharsets.UTF_8) : "";

        log.info("[inpay-webhook] notification received: clientIp={}, userAgent={}, sigPresent={}, authPresent={}, bodyLength={}, body={}",
                clientIp,
                userAgent,
                signature != null && !signature.isBlank(),
                authorization != null && !authorization.isBlank(),
                rawBody != null ? rawBody.length : 0,
                rawBodyStr);

        inPayService.handleWebhook(rawBody, signature, authorization, clientIp, userAgent);

        return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
