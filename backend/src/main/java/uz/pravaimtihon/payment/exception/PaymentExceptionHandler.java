package uz.pravaimtihon.payment.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Catches PaymentException globally (also when thrown from ExamService gate).
 * @Order(0) — runs before the platform's global handler, so it wins on PaymentException.
 * Only @ExceptionHandler(PaymentException.class) is declared, so it does NOT
 * intercept any other exception type and will not interfere with the existing handler.
 */
@RestControllerAdvice
@Order(0)
@Slf4j
public class PaymentExceptionHandler {

    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<Map<String, Object>> handle(PaymentException e) {
        log.warn("[payment] {} — {}", e.getStatus(), e.getMessage());
        return ResponseEntity.status(e.getStatus()).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "status", e.getStatus().value()
        ));
    }
}
