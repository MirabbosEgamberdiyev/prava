package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BaseException {
    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }

    public UnauthorizedException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.UNAUTHORIZED);
    }
}
