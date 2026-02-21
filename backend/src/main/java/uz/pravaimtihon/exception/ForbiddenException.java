package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends BaseException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.FORBIDDEN);
    }
}