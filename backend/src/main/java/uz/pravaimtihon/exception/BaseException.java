package uz.pravaimtihon.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

// ============================================
// Base Exception
// ============================================
@Getter
public class BaseException extends RuntimeException {
    private final HttpStatus status;
    private final String messageKey;
    private final Object[] args;

    public BaseException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.messageKey = null;
        this.args = null;
    }

    public BaseException(String messageKey, Object[] args, HttpStatus status) {
        super(messageKey);
        this.status = status;
        this.messageKey = messageKey;
        this.args = args;
    }
}