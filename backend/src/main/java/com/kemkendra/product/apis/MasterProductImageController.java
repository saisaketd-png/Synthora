package com.kemkendra.product.apis;

import com.kemkendra.product.CatalogImageService;
import com.kemkendra.product.dto.CatalogImageResponse;
import com.kemkendra.product.dto.UpdateImageAltTextPayload;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/master-products/{masterProductId}/images")
public class MasterProductImageController {

    private final CatalogImageService catalogImageService;

    public MasterProductImageController(CatalogImageService catalogImageService) {
        this.catalogImageService = catalogImageService;
    }

    @GetMapping
    public ResponseEntity<List<CatalogImageResponse>> getMasterProductImages(@PathVariable UUID masterProductId) {
        return ResponseEntity.ok(catalogImageService.getMasterProductImages(masterProductId));
    }

    @GetMapping("/{imageId}/content")
    public ResponseEntity<org.springframework.core.io.Resource> getImageContent(
            @PathVariable UUID masterProductId,
            @PathVariable UUID imageId) {
        com.kemkendra.product.dto.ImageContentResult result = catalogImageService.getMasterProductImageContent(masterProductId, imageId);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(result.contentType()))
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("X-Content-Type-Options", "nosniff")
                .body(result.resource());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogImageResponse> uploadMasterProductImage(
            @PathVariable UUID masterProductId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "altText", required = false) String altText,
            Authentication auth) {
        return ResponseEntity.ok(catalogImageService.uploadMasterProductImage(masterProductId, file, altText, auth));
    }

    @PutMapping("/{imageId}/primary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogImageResponse> setPrimaryMasterProductImage(
            @PathVariable UUID masterProductId,
            @PathVariable UUID imageId,
            Authentication auth) {
        return ResponseEntity.ok(catalogImageService.setPrimaryMasterProductImage(masterProductId, imageId, auth));
    }

    @PutMapping("/{imageId}/alt-text")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogImageResponse> updateMasterProductImageAltText(
            @PathVariable UUID masterProductId,
            @PathVariable UUID imageId,
            @RequestBody UpdateImageAltTextPayload payload,
            Authentication auth) {
        return ResponseEntity.ok(catalogImageService.updateMasterProductImageAltText(masterProductId, imageId, payload.altText(), auth));
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMasterProductImage(
            @PathVariable UUID masterProductId,
            @PathVariable UUID imageId,
            Authentication auth) {
        catalogImageService.deleteMasterProductImage(masterProductId, imageId, auth);
        return ResponseEntity.noContent().build();
    }
}
