package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BaseException {
    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }

    public ConflictException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.CONFLICT);
    }
}