package uz.pravaimtihon.payment.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class PaymentException extends RuntimeException {
    private final HttpStatus status;

    public PaymentException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static PaymentException badRequest(String msg)   { return new PaymentException(HttpStatus.BAD_REQUEST, msg); }
    public static PaymentException notFound(String msg)     { return new PaymentException(HttpStatus.NOT_FOUND, msg); }
    public static PaymentException conflict(String msg)     { return new PaymentException(HttpStatus.CONFLICT, msg); }
    public static PaymentException paymentRequired(String m){ return new PaymentException(HttpStatus.PAYMENT_REQUIRED, m); }
    public static PaymentException forbidden(String msg)    { return new PaymentException(HttpStatus.FORBIDDEN, msg); }
}
