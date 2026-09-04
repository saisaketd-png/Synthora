package com.kemkendra.common;

import com.kemkendra.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.data.mapping.PropertyReferenceException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiErrorResponse handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.NOT_FOUND.value(), "RESOURCE_NOT_FOUND", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "INVALID_ARGUMENT", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "VALIDATION_FAILED", msg, request.getRequestURI());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        String msg = ex.getConstraintViolations().stream()
                .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Constraint violation");
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "CONSTRAINT_VIOLATION", msg, request.getRequestURI());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleMethodValidation(HandlerMethodValidationException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "PARAMETER_VALIDATION_ERROR", "Validation error on request parameters", request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String paramName = ex.getName();
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "PARAMETER_TYPE_MISMATCH", "Invalid parameter format: " + (paramName != null ? paramName : "unknown"), request.getRequestURI());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "MALFORMED_REQUEST_BODY", "Malformed request body or invalid field format", request.getRequestURI());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleMissingParam(MissingServletRequestParameterException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "MISSING_PARAMETER", "Required parameter missing: " + ex.getParameterName(), request.getRequestURI());
    }

    @ExceptionHandler(PropertyReferenceException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handlePropertyReference(PropertyReferenceException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "INVALID_SORT_PROPERTY", "Invalid sort property: " + ex.getPropertyName(), request.getRequestURI());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public ApiErrorResponse handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.PAYLOAD_TOO_LARGE.value(), "PAYLOAD_TOO_LARGE", "Upload payload exceeds maximum permitted size", request.getRequestURI());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiErrorResponse handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.FORBIDDEN.value(), "FORBIDDEN", ex.getMessage() != null ? ex.getMessage() : "Access denied", request.getRequestURI());
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiErrorResponse handleAuthenticationException(org.springframework.security.core.AuthenticationException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.UNAUTHORIZED.value(), "UNAUTHORIZED", ex.getMessage() != null ? ex.getMessage() : "Authentication required to access this resource", request.getRequestURI());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.CONFLICT.value(), "INVALID_STATE_TRANSITION", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(com.kemkendra.security.RateLimitExceededException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ApiErrorResponse handleRateLimitExceeded(com.kemkendra.security.RateLimitExceededException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.TOO_MANY_REQUESTS.value(), "RATE_LIMIT_EXCEEDED", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ApiErrorResponse handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.METHOD_NOT_ALLOWED.value(), "METHOD_NOT_ALLOWED", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiErrorResponse handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.NOT_FOUND.value(), "NOT_FOUND", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex, HttpServletRequest request) {
        String msg = "A database constraint was violated. A record with the provided details may already exist.";
        String exMsg = ex.getMessage() != null ? ex.getMessage() : "";
        if (ex.getCause() != null && ex.getCause().getMessage() != null) {
            exMsg += " " + ex.getCause().getMessage();
        }
        if (exMsg.contains("users_phone_key")) {
            msg = "Phone number already registered";
        } else if (exMsg.contains("users_email_key")) {
            msg = "Email already registered";
        }
        log.warn("Database constraint violation on {}: {}", request.getRequestURI(), msg);
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.BAD_REQUEST.value(), "DUPLICATE_RESOURCE", msg, request.getRequestURI());
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiErrorResponse handleGeneralException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception processing request {}: ", request.getRequestURI(), ex);
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR", "An internal error occurred. Please try again later.", request.getRequestURI());
    }
}