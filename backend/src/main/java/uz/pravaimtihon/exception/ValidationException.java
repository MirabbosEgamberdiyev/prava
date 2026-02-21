package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

public class ValidationException extends BaseException {
    public ValidationException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public ValidationException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}