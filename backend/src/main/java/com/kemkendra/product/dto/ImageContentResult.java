package com.kemkendra.product.dto;

import org.springframework.core.io.Resource;

public record ImageContentResult(
        Resource resource,
        String contentType,
        String fileName
) {
}
