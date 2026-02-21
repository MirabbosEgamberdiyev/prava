package uz.pravaimtihon.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends BaseException {
    public BusinessException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }

    public BusinessException(String messageKey, Object... args) {
        super(messageKey, args, HttpStatus.BAD_REQUEST);
    }
}