package com.kemkendra.product.apis;

import com.kemkendra.product.ProductSupplierService;
import com.kemkendra.product.dto.ProductSupplierManageResponse;
import com.kemkendra.product.dto.ProductSupplierRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for supplier-managed ProductSupplier associations (Phase 2E.4).
 * <p>
 * All management endpoints require SUPPLIER role. Supplier identity is derived
 * from the authenticated principal — never from request payloads.
 * Product.seller is never modified by any operation here.
 * </p>
 */
@RestController
public class ProductSupplierController {

    private final ProductSupplierService productSupplierService;

    public ProductSupplierController(ProductSupplierService productSupplierService) {
        this.productSupplierService = productSupplierService;
    }

    // -----------------------------------------------------------------------
    // Product-scoped offering management
    // POST   /api/v1/products/{productId}/supplier-offering
    // GET    /api/v1/products/{productId}/supplier-offering
    // PUT    /api/v1/products/{productId}/supplier-offering
    // DELETE /api/v1/products/{productId}/supplier-offering
    // -----------------------------------------------------------------------

    @PreAuthorize("hasRole('SUPPLIER')")
    @PostMapping("/api/v1/products/{productId}/supplier-offering")
    public ProductSupplierManageResponse createOffering(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductSupplierRequest request,
            Authentication authentication) {
        return productSupplierService.createOffering(productId, request, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @GetMapping("/api/v1/products/{productId}/supplier-offering")
    public ProductSupplierManageResponse getMyOffering(
            @PathVariable UUID productId,
            Authentication authentication) {
        return productSupplierService.getMyOffering(productId, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @PutMapping("/api/v1/products/{productId}/supplier-offering")
    public ProductSupplierManageResponse updateOffering(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductSupplierRequest request,
            Authentication authentication) {
        return productSupplierService.updateOffering(productId, request, authentication);
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @DeleteMapping("/api/v1/products/{productId}/supplier-offering")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOffering(
            @PathVariable UUID productId,
            Authentication authentication) {
        productSupplierService.deleteOffering(productId, authentication);
    }

    // -----------------------------------------------------------------------
    // Supplier offering register
    // GET /api/v1/suppliers/me/product-offerings
    // -----------------------------------------------------------------------

    @PreAuthorize("hasRole('SUPPLIER')")
    @GetMapping("/api/v1/suppliers/me/product-offerings")
    public List<ProductSupplierManageResponse> getMyOfferings(Authentication authentication) {
        return productSupplierService.getMyOfferings(authentication);
    }
}
