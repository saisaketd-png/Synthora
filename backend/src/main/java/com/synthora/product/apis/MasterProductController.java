package com.synthora.product.apis;

import com.synthora.product.MasterProduct;
import com.synthora.product.MasterProductService;
import com.synthora.product.dto.AddSynonymPayload;
import com.synthora.product.dto.MasterProductResponse;
import com.synthora.product.dto.ProductSynonymResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/master-products")
public class MasterProductController {

    private final MasterProductService masterProductService;

    public MasterProductController(MasterProductService masterProductService) {
        this.masterProductService = masterProductService;
    }

    @GetMapping
    public ResponseEntity<Page<MasterProductResponse>> searchMasterProducts(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(masterProductService.searchMasterProducts(query, page, size));
    }

    @GetMapping("/{idOrCode}")
    public ResponseEntity<MasterProductResponse> getMasterProduct(@PathVariable String idOrCode) {
        try {
            UUID uuid = UUID.fromString(idOrCode.trim());
            return ResponseEntity.ok(masterProductService.getMasterProductById(uuid));
        } catch (IllegalArgumentException ignored) {
            return ResponseEntity.ok(masterProductService.getMasterProductByCode(idOrCode));
        }
    }

    @GetMapping("/cas/{casNumber}")
    public ResponseEntity<List<MasterProductResponse>> getMasterProductsByCas(@PathVariable String casNumber) {
        return ResponseEntity.ok(masterProductService.getMasterProductsByCas(casNumber));
    }

    @GetMapping("/{idOrCode}/synonyms")
    public ResponseEntity<List<ProductSynonymResponse>> getApprovedSynonyms(@PathVariable String idOrCode) {
        MasterProduct mp = masterProductService.resolveMasterProduct(idOrCode);
        return ResponseEntity.ok(masterProductService.getApprovedSynonyms(mp.getId()));
    }

    @PostMapping("/{idOrCode}/synonyms")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ProductSynonymResponse> suggestSynonym(
            @PathVariable String idOrCode,
            @Valid @RequestBody AddSynonymPayload payload,
            Authentication authentication) {
        MasterProduct mp = masterProductService.resolveMasterProduct(idOrCode);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(masterProductService.suggestSupplierSynonym(mp.getId(), payload, authentication));
    }
}
