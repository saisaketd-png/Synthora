package com.synthora.common;

import com.synthora.common.dto.ApiErrorResponse;
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

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.CONFLICT.value(), "INVALID_STATE_TRANSITION", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(com.synthora.security.RateLimitExceededException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ApiErrorResponse handleRateLimitExceeded(com.synthora.security.RateLimitExceededException ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.TOO_MANY_REQUESTS.value(), "RATE_LIMIT_EXCEEDED", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiErrorResponse handleGeneralException(Exception ex, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR", "An internal error occurred. Please try again later.", request.getRequestURI());
    }
}