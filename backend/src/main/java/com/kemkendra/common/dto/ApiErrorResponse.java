package com.kemkendra.common.dto;

import java.time.LocalDateTime;

public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String code,
        String message,
        String path
) {
    public ApiErrorResponse(int status, String code, String message, String path) {
        this(LocalDateTime.now(), status, code, message, path);
    }
}
