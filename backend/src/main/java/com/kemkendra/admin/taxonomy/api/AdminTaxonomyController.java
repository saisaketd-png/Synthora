package com.kemkendra.admin.taxonomy.api;

import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import com.kemkendra.admin.taxonomy.AdminTaxonomyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/taxonomy")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaxonomyController {

    private final AdminTaxonomyService taxonomyService;

    public AdminTaxonomyController(AdminTaxonomyService taxonomyService) {
        this.taxonomyService = taxonomyService;
    }

    @GetMapping
    public ResponseEntity<TaxonomiesResponse> getAllTaxonomies() {
        return ResponseEntity.ok(taxonomyService.getAllTaxonomiesGrouped());
    }

    @GetMapping("/by-type/{type}")
    public ResponseEntity<List<CatalogTaxonomyDto>> getTaxonomiesByType(
            @PathVariable String type,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(taxonomyService.getTaxonomiesByType(type, activeOnly));
    }

    @PostMapping
    public ResponseEntity<CatalogTaxonomyDto> createTaxonomy(
            @Valid @RequestBody CreateTaxonomyRequest request,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(taxonomyService.createTaxonomy(request, actorEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CatalogTaxonomyDto> updateTaxonomy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaxonomyRequest request,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(taxonomyService.updateTaxonomy(id, request, actorEmail));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<CatalogTaxonomyDto> activateTaxonomy(
            @PathVariable UUID id,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(taxonomyService.setTaxonomyActive(id, true, actorEmail));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<CatalogTaxonomyDto> deactivateTaxonomy(
            @PathVariable UUID id,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(taxonomyService.setTaxonomyActive(id, false, actorEmail));
    }
}
