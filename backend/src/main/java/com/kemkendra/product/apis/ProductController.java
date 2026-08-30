package com.kemkendra.product.apis;

import com.kemkendra.product.ProductService;
import com.kemkendra.product.dto.ProductDetailResponse;
import com.kemkendra.product.dto.ProductSupplierResponse;
import com.kemkendra.product.dto.ProductResponse;
import org.springframework.data.domain.Page;

import com.kemkendra.product.ProductCategory;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import com.kemkendra.product.dto.CreateProductRequest;
import com.kemkendra.product.dto.UpdateProductRequest;
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{idOrCode}/detail")
    public ProductDetailResponse getProductDetail(@PathVariable String idOrCode) {
        return productService.getProductDetailByIdOrCode(idOrCode);
    }
    
    @GetMapping
    public Page<ProductResponse> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<ProductCategory> category,
            @RequestParam(required = false) String casNumber,
            @RequestParam(required = false) BigDecimal purityMin,
            @RequestParam(required = false) BigDecimal purityMax,
            @RequestParam(required = false) BigDecimal moqMin,
            @RequestParam(required = false) BigDecimal moqMax,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Boolean coa,
            @RequestParam(required = false) Boolean msds,
            @RequestParam(required = false) Boolean exportReady,
            @RequestParam(required = false) String availability,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        String effectiveSearch = search != null ? search : keyword;
        return productService.searchCatalogProducts(
                effectiveSearch,
                category,
                casNumber,
                purityMin,
                purityMax,
                moqMin,
                moqMax,
                inStock,
                coa,
                msds,
                exportReady,
                availability,
                page,
                size,
                sortField,
                sortDir
        );
    }
    
    @GetMapping("/{id}/suppliers")
    public List<ProductSupplierResponse> getProductSuppliers(@PathVariable UUID id) {
        return productService.getProductSuppliers(id);
    }

    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(productService.createProduct(request, authentication));
    }

    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(productService.updateProduct(id, request, authentication));
    }

    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable UUID id,
            Authentication authentication) {
        productService.deleteProduct(id, authentication);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('SUPPLIER')")
    @GetMapping("/my")
    public Page<ProductResponse> getMyProducts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return productService.getMyProducts(authentication, page, size, sortField, sortDir);
    }
}