package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

public class RateLimitExceededException extends BaseException {
    public RateLimitExceededException(String message) {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    public RateLimitExceededException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.TOO_MANY_REQUESTS);
    }
}