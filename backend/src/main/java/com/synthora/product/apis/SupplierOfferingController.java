package com.synthora.product.apis;

import com.synthora.product.SupplierOfferingService;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.dto.UpdateSupplierOfferingRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/supplier/offerings")
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierOfferingController {

    private final SupplierOfferingService supplierOfferingService;

    public SupplierOfferingController(SupplierOfferingService supplierOfferingService) {
        this.supplierOfferingService = supplierOfferingService;
    }

    @PostMapping
    public ResponseEntity<SupplierOfferingResponse> createOffering(
            @Valid @RequestBody CreateSupplierOfferingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.createOffering(request, authentication));
    }

    @GetMapping
    public ResponseEntity<List<SupplierOfferingResponse>> getMyOfferings(Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.getMyOfferings(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierOfferingResponse> getOfferingById(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.getOfferingById(id, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierOfferingResponse> updateOffering(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSupplierOfferingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.updateOffering(id, request, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<SupplierOfferingResponse> deactivateOffering(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.deactivateOffering(id, authentication));
    }
}
