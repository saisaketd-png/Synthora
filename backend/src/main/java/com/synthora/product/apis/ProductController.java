package com.synthora.product.api;

import com.synthora.product.ProductService;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.ProductResponse;
import com.synthora.product.dto.UpdateProductRequest;
import com.synthora.product.ProductCategory;


import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // GET ALL PRODUCTS + SEARCH + PAGINATION + SORTING
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir) {

        if (category != null) {
            return ResponseEntity.ok(
                    productService.getProductsByCategory(
                            category,
                            page,
                            size,
                            sortField,
                            sortDir
                    )
            );
        }

        if (keyword != null && !keyword.isBlank()) {
            return ResponseEntity.ok(
                    productService.searchProducts(
                            keyword,
                            page,
                            size,
                            sortField,
                            sortDir
                    )
            );
        }

        return ResponseEntity.ok(
                productService.getProducts(
                        page,
                        size,
                        sortField,
                        sortDir
                )
        );
    }

    @GetMapping("/my")
    public ResponseEntity<Page<ProductResponse>> getMyProducts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(
                productService.getMyProducts(
                        authentication,
                        page,
                        size,
                        sortField,
                        sortDir
                )
        );
    }

    // FILTER PRODUCTS
    @GetMapping("/filter")
    public ResponseEntity<Page<ProductResponse>> filterProducts(
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(
                productService.filterProducts(
                        minPrice,
                        maxPrice,
                        inStock,
                        page,
                        size,
                        sortField,
                        sortDir
                )
        );
    }

    // GET PRODUCT BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable UUID id) {

        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }

    // CREATE PRODUCT
    @PreAuthorize("hasAnyRole('SUPPLIER','ADMIN')")
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            Authentication authentication) {

        ProductResponse response =
                productService.createProduct(request, authentication);

        return ResponseEntity.ok(response);
    }

    // UPDATE PRODUCT
    @PreAuthorize("hasAnyRole('SUPPLIER','ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request,
            Authentication authentication) {

        ProductResponse response =
                productService.updateProduct(id, request, authentication);

        return ResponseEntity.ok(response);
    }

    // DELETE PRODUCT
    @PreAuthorize("hasAnyRole('SUPPLIER','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable UUID id,
            Authentication authentication) {

        productService.deleteProduct(id, authentication);

        return ResponseEntity.noContent().build();
    }
}