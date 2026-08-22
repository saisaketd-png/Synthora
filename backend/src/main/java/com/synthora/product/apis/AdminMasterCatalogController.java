package com.synthora.product.apis;

import com.synthora.governance.dto.GovernanceAuditLogResponse;
import com.synthora.product.AdminMasterCatalogService;
import com.synthora.product.ProductCategory;
import com.synthora.product.SupplierOfferingService;
import com.synthora.product.dto.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/catalog")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMasterCatalogController {

    private final AdminMasterCatalogService adminMasterCatalogService;
    private final SupplierOfferingService supplierOfferingService;

    public AdminMasterCatalogController(
            AdminMasterCatalogService adminMasterCatalogService,
            SupplierOfferingService supplierOfferingService) {
        this.adminMasterCatalogService = adminMasterCatalogService;
        this.supplierOfferingService = supplierOfferingService;
    }

    @GetMapping("/master-products")
    public ResponseEntity<Page<MasterProductResponse>> searchAdminMasterProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String casNumber,
            @RequestParam(required = false) String masterProductCode,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) Boolean supplierVerified,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication authentication) {

        AdminMasterProductSearchCriteria criteria = new AdminMasterProductSearchCriteria(
                query, casNumber, masterProductCode, category, status, supplierId, supplierVerified, page, size, sort
        );

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        String property = sortParts[0];

        PageRequest pageRequest = PageRequest.of(criteria.page(), criteria.size(), Sort.by(direction, property));
        return ResponseEntity.ok(adminMasterCatalogService.searchAdminMasterProducts(criteria, pageRequest, authentication));
    }

    @PostMapping("/master-products")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<MasterProductResponse> createMasterProduct(
            @Valid @RequestBody CreateMasterProductPayload payload,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminMasterCatalogService.createMasterProduct(payload, authentication));
    }

    @PutMapping("/master-products/{id}")
    public ResponseEntity<MasterProductResponse> updateMasterProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMasterProductPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.updateMasterProduct(id, payload, authentication));
    }

    @GetMapping("/governance-stats")
    public ResponseEntity<GovernanceStatsResponse> getGovernanceStats(Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getGovernanceStats(authentication));
    }

    @GetMapping("/requests")
    public ResponseEntity<Page<ProductRequestResponse>> getRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getRequestsByStatus(
                status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")),
                authentication
        ));
    }

    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<MasterProductResponse> approveRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveProductRequestPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.approveRequest(id, payload, authentication));
    }

    @PostMapping("/requests/{id}/approve-and-link")
    public ResponseEntity<MasterProductResponse> approveAndLinkRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveAndLinkPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.approveAndLinkRequest(id, payload, authentication));
    }

    @PostMapping("/requests/{id}/request-info")
    public ResponseEntity<ProductRequestResponse> requestProductInformation(
            @PathVariable UUID id,
            @Valid @RequestBody RequestProductInfoPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.requestProductInformation(id, payload, authentication));
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<ProductRequestResponse> rejectRequest(
            @PathVariable UUID id,
            @Valid @RequestBody RejectProductRequestPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.rejectRequest(id, payload, authentication));
    }

    @GetMapping("/duplicates")
    public ResponseEntity<List<DuplicateCandidateResponse>> getDuplicates(Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.findDuplicateCandidates(authentication));
    }

    @PostMapping("/merge")
    public ResponseEntity<MasterProductResponse> mergeMasterProducts(
            @Valid @RequestBody MergeMasterProductsPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.mergeMasterProducts(payload, authentication));
    }

    @PutMapping("/master-products/{id}/status")
    public ResponseEntity<MasterProductResponse> setMasterProductStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.setMasterProductStatus(id, status, authentication));
    }

    @GetMapping("/master-products/{id}")
    public ResponseEntity<MasterProductDetailResponse> getMasterProductDetail(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getMasterProductDetail(id, authentication));
    }

    @PostMapping("/master-products/{id}/verify")
    public ResponseEntity<MasterProductResponse> verifyChemicalField(
            @PathVariable UUID id,
            @Valid @RequestBody VerifyChemicalFieldPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.verifyChemicalField(id, payload, authentication));
    }

    @GetMapping("/offerings")
    public ResponseEntity<Page<SupplierOfferingResponse>> getOfferings(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String moderationStatus,
            @RequestParam(required = false) Boolean flagged,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.searchSupplierOfferings(query, moderationStatus, flagged, supplierId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")), authentication));
    }

    @GetMapping("/offerings/{id}")
    public ResponseEntity<SupplierOfferingResponse> getOfferingById(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.getOfferingById(id));
    }

    @PostMapping("/offerings/{id}/approve")
    public ResponseEntity<SupplierOfferingResponse> approveOffering(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.approveOffering(id, notes, authentication));
    }

    @PostMapping("/offerings/{id}/reject")
    public ResponseEntity<SupplierOfferingResponse> rejectOffering(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.rejectOffering(id, notes, authentication));
    }

    @PostMapping("/offerings/{id}/flag")
    public ResponseEntity<SupplierOfferingResponse> flagOffering(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.flagOffering(id, notes, authentication));
    }

    @PostMapping("/offerings/{id}/request-info")
    public ResponseEntity<SupplierOfferingResponse> requestInfoOffering(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.requestInfoOffering(id, notes, authentication));
    }

    @PostMapping("/offerings/{id}/suspend")
    public ResponseEntity<SupplierOfferingResponse> suspendOffering(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        return ResponseEntity.ok(supplierOfferingService.suspendOffering(id, notes, authentication));
    }

    @GetMapping("/audit")
    public ResponseEntity<Page<GovernanceAuditLogResponse>> getAudit(
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getAllAuditLogs(entityType, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp")), authentication));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<GovernanceAuditLogResponse>> getAuditLogs(
            @RequestParam String entityType,
            @RequestParam String entityId,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getAuditLogsForEntity(entityType, entityId, authentication));
    }

    // --- Product Synonyms Management ---

    @GetMapping("/master-products/{id}/synonyms")
    public ResponseEntity<List<ProductSynonymResponse>> getMasterProductSynonyms(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getSynonymsForMasterProduct(id, authentication));
    }

    @PostMapping("/master-products/{id}/synonyms")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ProductSynonymResponse> addOfficialSynonym(
            @PathVariable UUID id,
            @Valid @RequestBody AddSynonymPayload payload,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminMasterCatalogService.addOfficialSynonym(id, payload, authentication));
    }

    @DeleteMapping("/master-products/{id}/synonyms/{synonymId}")
    public ResponseEntity<Void> deleteSynonym(
            @PathVariable UUID id,
            @PathVariable UUID synonymId,
            Authentication authentication) {
        adminMasterCatalogService.deleteSynonym(id, synonymId, authentication);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/synonyms/{synonymId}/review")
    public ResponseEntity<ProductSynonymResponse> reviewSynonym(
            @PathVariable UUID synonymId,
            @Valid @RequestBody ReviewSynonymPayload payload,
            Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.reviewSupplierSynonym(synonymId, payload, authentication));
    }

    @GetMapping("/synonyms/pending")
    public ResponseEntity<List<ProductSynonymResponse>> getPendingSynonyms(Authentication authentication) {
        return ResponseEntity.ok(adminMasterCatalogService.getPendingSynonyms(authentication));
    }
}
