package uz.pravaimtihon.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import uz.pravaimtihon.dto.response.ApiResponse;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * BaseException handle qilish - messageKey dan tarjima olish
     */
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ApiResponse<?>> handleBaseException(
            BaseException ex,
            HttpServletRequest request
    ) {
        // 4xx → warn, 5xx → error
        if (ex.getStatus().is4xxClientError()) {
            log.warn("BaseException [{}]: {}", ex.getStatus().value(), ex.getMessage());
        } else {
            log.error("BaseException [{}]: {}", ex.getStatus().value(), ex.getMessage(), ex);
        }

        String message;
        if (ex.getMessageKey() != null) {
            message = getMessage(ex.getMessageKey(), ex.getArgs());
        } else {
            String rawMessage = ex.getMessage();
            if (rawMessage != null && (rawMessage.startsWith("validation.") || rawMessage.startsWith("error."))) {
                message = getMessage(rawMessage, ex.getArgs());
            } else {
                message = rawMessage != null ? rawMessage : "Unknown error";
            }
        }

        ApiResponse<?> response = ApiResponse.error(message, request.getRequestURI());
        return ResponseEntity.status(ex.getStatus()).body(response);
    }

    /**
     * @Valid validation xatolari
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        log.warn("Validation error: {}", ex.getMessage());

        List<ApiResponse.ValidationError> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::mapFieldError)
                .collect(Collectors.toList());

        ApiResponse<?> response = ApiResponse.validationError(errors, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    /**
     * Constraint violation xatolari
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        log.warn("Constraint violation: {}", ex.getMessage());

        List<ApiResponse.ValidationError> errors = ex.getConstraintViolations()
                .stream()
                .map(this::mapConstraintViolation)
                .collect(Collectors.toList());

        ApiResponse<?> response = ApiResponse.validationError(errors, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    /**
     * Malformed JSON request body
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        log.warn("Malformed request body: {}", ex.getMessage());

        ApiResponse<?> response = ApiResponse.error("Malformed request body", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Method not allowed (GET instead of POST, etc.)
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request
    ) {
        log.warn("Method not supported: {} {}", ex.getMethod(), request.getRequestURI());

        ApiResponse<?> response = ApiResponse.error("Method not allowed: " + ex.getMethod(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(response);
    }

    /**
     * No handler found (404)
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNoHandlerFound(
            NoHandlerFoundException ex,
            HttpServletRequest request
    ) {
        log.warn("No handler found: {} {}", ex.getHttpMethod(), ex.getRequestURL());

        ApiResponse<?> response = ApiResponse.error("Not found", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Access Denied
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        log.warn("Access denied: {}", ex.getMessage());

        String message = getMessage("error.permission.denied");
        ApiResponse<?> response = ApiResponse.error(message, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Bad Credentials
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest request
    ) {
        log.warn("Bad credentials: {}", ex.getMessage());

        String message = getMessage("error.auth.invalid.credentials");
        ApiResponse<?> response = ApiResponse.error(message, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Authentication xatolari
     */
    @ExceptionHandler({AuthenticationException.class, InsufficientAuthenticationException.class})
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.warn("Authentication error: {}", ex.getMessage());

        String message = getMessage("error.auth.required");
        ApiResponse<?> response = ApiResponse.error(message, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Umumiy xatolar
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneralException(
            Exception ex,
            HttpServletRequest request
    ) {
        log.error("Unexpected error occurred", ex);

        String message = getMessage("error.internal.server");
        ApiResponse<?> response = ApiResponse.error(message, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    // ============================================
    // Helper Methods
    // ============================================

    private ApiResponse.ValidationError mapFieldError(FieldError error) {
        String message = error.getDefaultMessage();

        if (message != null && (message.startsWith("validation.") || message.startsWith("error."))) {
            message = getMessage(message);
        }

        return ApiResponse.ValidationError.builder()
                .field(error.getField())
                .message(message)
                .rejectedValue(error.getRejectedValue())
                .build();
    }

    private ApiResponse.ValidationError mapConstraintViolation(ConstraintViolation<?> violation) {
        String field = violation.getPropertyPath().toString();
        String message = violation.getMessage();

        if (message != null && (message.startsWith("validation.") || message.startsWith("error."))) {
            message = getMessage(message);
        }

        return ApiResponse.ValidationError.builder()
                .field(field)
                .message(message)
                .rejectedValue(violation.getInvalidValue())
                .build();
    }

    private String getMessage(String key, Object... args) {
        try {
            return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            log.warn("Message key not found: {}, using key as message", key);
            return key;
        }
    }
}
