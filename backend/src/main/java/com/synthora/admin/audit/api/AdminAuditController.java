package com.synthora.admin.audit.api;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditService;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.audit.dto.AdminAuditLogResponse;
import com.synthora.admin.audit.dto.AuditKpiSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Administrative Audit & Governance Controller.
 * Exposes paginated multi-criteria audit trail search and KPI summaries for administrators.
 */
@RestController
@RequestMapping("/api/v1/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditService auditService;

    public AdminAuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Search and paginate administrative audit logs with dynamic multi-parameter filtering.
     */
    @GetMapping
    public ResponseEntity<Page<AdminAuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) UUID adminId,
            @RequestParam(required = false) AuditTargetType targetType,
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AdminAuditLogResponse> logs = auditService.searchAuditLogs(
                action,
                adminId,
                targetType,
                targetId,
                from,
                to,
                query,
                page,
                size
        );

        return ResponseEntity.ok(logs);
    }

    /**
     * Retrieves summary KPI counts across governance pillars.
     */
    @GetMapping("/summary")
    public ResponseEntity<AuditKpiSummaryResponse> getAuditSummary() {
        return ResponseEntity.ok(auditService.getAuditKpiSummary());
    }
}
