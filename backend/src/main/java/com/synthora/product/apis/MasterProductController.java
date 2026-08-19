package com.synthora.product.apis;

import com.synthora.product.MasterProductService;
import com.synthora.product.dto.MasterProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
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
}
