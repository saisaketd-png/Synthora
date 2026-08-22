package com.synthora.product.apis;

import com.synthora.product.CatalogImageService;
import com.synthora.product.dto.CatalogImageResponse;
import com.synthora.product.dto.UpdateImageAltTextPayload;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/supplier/offerings/{offeringId}/images")
public class SupplierOfferingImageController {

    private final CatalogImageService catalogImageService;

    public SupplierOfferingImageController(CatalogImageService catalogImageService) {
        this.catalogImageService = catalogImageService;
    }

    @GetMapping
    public ResponseEntity<List<CatalogImageResponse>> getOfferingImages(@PathVariable UUID offeringId) {
        return ResponseEntity.ok(catalogImageService.getOfferingImages(offeringId));
    }

    @GetMapping("/{imageId}/content")
    public ResponseEntity<org.springframework.core.io.Resource> getImageContent(
            @PathVariable UUID offeringId,
            @PathVariable UUID imageId) {
        com.synthora.product.dto.ImageContentResult result = catalogImageService.getOfferingImageContent(offeringId, imageId);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(result.contentType()))
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header("X-Content-Type-Options", "nosniff")
                .body(result.resource());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<CatalogImageResponse> uploadOfferingImage(
            @PathVariable UUID offeringId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "altText", required = false) String altText,
            Authentication auth) {
        return ResponseEntity.ok(catalogImageService.uploadOfferingImage(offeringId, file, altText, auth));
    }

    @PutMapping("/{imageId}/primary")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<CatalogImageResponse> setPrimaryOfferingImage(
            @PathVariable UUID offeringId,
            @PathVariable UUID imageId,
            Authentication auth) {
        return ResponseEntity.ok(catalogImageService.setPrimaryOfferingImage(offeringId, imageId, auth));
    }

    @PutMapping("/{imageId}/alt-text")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<CatalogImageResponse> updateOfferingImageAltText(
            @PathVariable UUID offeringId,
            @PathVariable UUID imageId,
            @RequestBody UpdateImageAltTextPayload payload,
            Authentication auth) {
        return ResponseEntity.ok(catalogImageService.updateOfferingImageAltText(offeringId, imageId, payload.altText(), auth));
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<Void> deleteOfferingImage(
            @PathVariable UUID offeringId,
            @PathVariable UUID imageId,
            Authentication auth) {
        catalogImageService.deleteOfferingImage(offeringId, imageId, auth);
        return ResponseEntity.noContent().build();
    }
}
