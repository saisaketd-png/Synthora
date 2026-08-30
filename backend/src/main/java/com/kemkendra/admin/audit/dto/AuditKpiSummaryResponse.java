package com.kemkendra.admin.audit.dto;

/**
 * Summary KPI counts for the Admin Audit & Governance Engine dashboard.
 */
public record AuditKpiSummaryResponse(
        long totalEvents,
        long todayEvents,
        long userGovernanceEvents,
        long supplierGovernanceEvents,
        long catalogGovernanceEvents
) {
}
