package com.synthora.product.apis;

import com.synthora.product.ProductService;
import com.synthora.product.dto.ProductDetailResponse;
import com.synthora.product.dto.ProductSupplierResponse;
import java.util.List;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

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
    @GetMapping("/{id}/suppliers")
    public List<ProductSupplierResponse> getProductSuppliers(@PathVariable UUID id) {
        return productService.getProductSuppliers(id);
    }
}