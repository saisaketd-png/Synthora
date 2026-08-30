package com.kemkendra.admin.operations;

import com.kemkendra.admin.operations.dto.AdminOperationsDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/operations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOperationsController {

    private final AdminOperationsService operationsService;

    public AdminOperationsController(AdminOperationsService operationsService) {
        this.operationsService = operationsService;
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
