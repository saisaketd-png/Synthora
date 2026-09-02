package com.kemkendra.admin.operations;

import com.kemkendra.admin.operations.dto.AdminOperationsDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOperationsController {

    private final AdminOperationsService operationsService;

    public AdminOperationsController(AdminOperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/platform-snapshot")
    public ResponseEntity<PlatformSnapshotResponse> getPlatformSnapshot() {
        return ResponseEntity.ok(operationsService.getPlatformSnapshot());
    }

    @GetMapping("/attention-queue")
    public ResponseEntity<List<AttentionQueueItem>> getAttentionQueue() {
        return ResponseEntity.ok(operationsService.getOperationalAttentionQueue());
    }

    @GetMapping("/marketplace/quotations")
    public ResponseEntity<Page<AdminMarketplaceQuotationDto>> getMarketplaceQuotations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) UUID rfqId) {
        return ResponseEntity.ok(operationsService.getMarketplaceQuotations(page, size, actionType, supplierId, rfqId));
    }

    @GetMapping("/marketplace/shipments")
    public ResponseEntity<Page<AdminMarketplaceShipmentDto>> getMarketplaceShipments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String carrier,
            @RequestParam(required = false) String trackingNumber) {
        return ResponseEntity.ok(operationsService.getMarketplaceShipments(page, size, carrier, trackingNumber));
    }

    @GetMapping("/kpis")
    public ResponseEntity<AdminKpiSummaryResponse> getKpiSummary() {
        return ResponseEntity.ok(operationsService.getKpiSummary());
    }

    @GetMapping("/action-center")
    public ResponseEntity<List<ActionCenterItemResponse>> getActionCenter() {
        return ResponseEntity.ok(operationsService.getActionCenterItems());
    }

    @GetMapping("/catalog/quality")
    public ResponseEntity<Page<MasterProductQualityItemResponse>> getMasterProductQuality(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(operationsService.getMasterProductQualityList(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @GetMapping("/suppliers/quality")
    public ResponseEntity<Page<SupplierQualityItemResponse>> getSupplierQuality(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(operationsService.getSupplierQualityList(PageRequest.of(page, size)));
    }

    @GetMapping("/offerings/quality")
    public ResponseEntity<Page<SupplierOfferingQualityItemResponse>> getOfferingQuality(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(operationsService.getSupplierOfferingQualityList(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AdminSearchResultItem>> searchAll(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(operationsService.searchAll(query, page, size));
    }

    @GetMapping("/governance/queue")
    public ResponseEntity<Page<GovernanceQueueItem>> getGovernanceQueue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(operationsService.getGovernanceQueue(PageRequest.of(page, size)));
    }
}
