package com.kemkendra.product.apis;

import com.kemkendra.product.ProductRequestService;
import com.kemkendra.product.dto.CreateProductRequestRequest;
import com.kemkendra.product.dto.ProductRequestResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/product-requests")
@PreAuthorize("hasRole('SUPPLIER')")
public class ProductRequestController {

    private final ProductRequestService productRequestService;

    public ProductRequestController(ProductRequestService productRequestService) {
        this.productRequestService = productRequestService;
    }

    @PostMapping
    public ResponseEntity<ProductRequestResponse> createRequest(
            @Valid @RequestBody CreateProductRequestRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(productRequestService.createRequest(request, authentication));
    }

    @GetMapping
    public ResponseEntity<List<ProductRequestResponse>> getMyRequests(Authentication authentication) {
        return ResponseEntity.ok(productRequestService.getMyRequests(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductRequestResponse> getRequestById(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(productRequestService.getRequestById(id, authentication));
    }

    @PostMapping("/{id}/respond")
    public ResponseEntity<ProductRequestResponse> respondToInfoRequest(
            @PathVariable UUID id,
            @Valid @RequestBody com.kemkendra.product.dto.RespondProductInfoPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(productRequestService.respondProductInformation(id, payload, authentication));
    }
}
