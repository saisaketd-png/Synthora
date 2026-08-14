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
}