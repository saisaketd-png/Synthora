package com.synthora.product.apis;

import com.synthora.product.ProductService;
import com.synthora.product.dto.ProductDetailResponse;
import com.synthora.product.dto.ProductSupplierResponse;
import com.synthora.product.dto.ProductResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.UpdateProductRequest;
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}/detail")
    public ProductDetailResponse getProductDetail(@PathVariable UUID id) {
        return productService.getProductDetail(id);
    }
    
    @GetMapping
    public Page<ProductResponse> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return productService.getProducts(page, size, sortField, sortDir);
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