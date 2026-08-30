package com.kemkendra.product.apis;

import com.kemkendra.product.ProductImageService;
import com.kemkendra.product.dto.ProductImageResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{productId}/images")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    @GetMapping
    public ResponseEntity<List<ProductImageResponse>> getProductImages(@PathVariable UUID productId) {
        return ResponseEntity.ok(productImageService.getProductImages(productId));
    }

    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductImageResponse> uploadProductImage(
            @PathVariable UUID productId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        ProductImageResponse response = productImageService.uploadProductImage(productId, file, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{imageId}/content")
    public ResponseEntity<Resource> getImageContent(
            @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        ProductImageService.ImageContentResult result = productImageService.getImageContent(productId, imageId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("X-Content-Type-Options", "nosniff")
                .body(result.resource());
    }

    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @PutMapping("/{imageId}/primary")
    public ResponseEntity<ProductImageResponse> setPrimaryImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId,
            Authentication authentication) {
        return ResponseEntity.ok(productImageService.setPrimaryImage(productId, imageId, authentication));
    }

    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteProductImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId,
            Authentication authentication) {
        productImageService.deleteProductImage(productId, imageId, authentication);
        return ResponseEntity.noContent().build();
    }
}
