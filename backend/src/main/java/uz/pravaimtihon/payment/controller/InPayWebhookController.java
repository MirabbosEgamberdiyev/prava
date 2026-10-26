package uz.pravaimtihon.payment.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.payment.service.InPayService;

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
            @RequestBody(required = false) byte[] rawBody) {

        log.info("[inpay-webhook] incoming notification, signaturePresent={}, bodyLength={}",
                signature != null && !signature.isBlank(),
                rawBody != null ? rawBody.length : 0);

        inPayService.handleWebhook(rawBody, signature);

        return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
    }
}
