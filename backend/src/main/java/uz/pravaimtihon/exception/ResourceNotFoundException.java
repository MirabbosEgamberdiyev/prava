package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

// ============================================
// Specific Exceptions
// ============================================
public class ResourceNotFoundException extends BaseException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.NOT_FOUND);
    }
}