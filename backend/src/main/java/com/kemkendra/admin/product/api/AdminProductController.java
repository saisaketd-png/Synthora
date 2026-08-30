package com.kemkendra.admin.product.api;

import com.kemkendra.admin.product.AdminProductService;
import com.kemkendra.admin.product.dto.*;
import com.kemkendra.product.ProductCategory;
import com.kemkendra.product.dto.ProductSupplierRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller exposing administrative Product and ProductSupplier moderation endpoints.
 * Strictly restricted to administrators via {@code @PreAuthorize("hasRole('ADMIN')")}.
 */
@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    @GetMapping
    public ResponseEntity<Page<AdminProductResponse>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) UUID sellerId,
            @RequestParam(required = false) String availabilityStatus) {

        String effectiveQuery = (query != null && !query.trim().isEmpty()) ? query : q;
        Page<AdminProductResponse> products = adminProductService.getProducts(
                page,
                size,
                effectiveQuery,
                category,
                sellerId,
                availabilityStatus
        );
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminProductDetailResponse> getProductDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminProductService.getProductDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminProductRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminProductService.updateProduct(id, request, authentication, servletRequest));
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<AdminProductResponse> updateAvailability(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductAvailabilityRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminProductService.updateAvailability(id, request, authentication, servletRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AdminProductResponse> deactivateProduct(
            @PathVariable UUID id,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminProductService.deactivateProduct(id, authentication, servletRequest));
    }

    @GetMapping("/{productId}/suppliers")
    public ResponseEntity<List<AdminProductSupplierResponse>> getProductSuppliers(
            @PathVariable UUID productId) {

        return ResponseEntity.ok(adminProductService.getProductSuppliers(productId));
    }

    @PutMapping("/{productId}/suppliers/{supplierId}")
    public ResponseEntity<AdminProductSupplierResponse> updateProductSupplierOffering(
            @PathVariable UUID productId,
            @PathVariable Long supplierId,
            @RequestBody ProductSupplierRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminProductService.updateProductSupplierOffering(
                productId,
                supplierId,
                request,
                authentication,
                servletRequest
        ));
    }

    @DeleteMapping("/{productId}/suppliers/{supplierId}")
    public ResponseEntity<Void> deleteProductSupplierOffering(
            @PathVariable UUID productId,
            @PathVariable Long supplierId,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        adminProductService.deleteProductSupplierOffering(productId, supplierId, authentication, servletRequest);
        return ResponseEntity.noContent().build();
    }
}
