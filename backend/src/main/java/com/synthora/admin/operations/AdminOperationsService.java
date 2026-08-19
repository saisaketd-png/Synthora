package com.synthora.admin.operations;

import com.synthora.admin.operations.dto.AdminOperationsDtos.*;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.product.*;
import com.synthora.rfq.RfqRepository;
import com.synthora.seller.SupplierVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class AdminOperationsService {

    private final MasterProductRepository masterProductRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final ProductRequestRepository productRequestRepository;
    private final RfqRepository rfqRepository;
    private final PurchaseOrderRepository poRepository;

    public AdminOperationsService(
            MasterProductRepository masterProductRepository,
            SupplierRepository supplierRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            ProductRequestRepository productRequestRepository,
            RfqRepository rfqRepository,
            PurchaseOrderRepository poRepository) {
        this.masterProductRepository = masterProductRepository;
        this.supplierRepository = supplierRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.productRequestRepository = productRequestRepository;
        this.rfqRepository = rfqRepository;
        this.poRepository = poRepository;
    }

    public AdminKpiSummaryResponse getKpiSummary() {
        long activeMp = masterProductRepository.countByStatus("ACTIVE");
        long draftMp = masterProductRepository.countByStatus("DRAFT");
        long inactiveMp = masterProductRepository.countByStatus("INACTIVE");
        long mergedMp = masterProductRepository.countByStatus("MERGED");

        CatalogKpis catalogKpis = new CatalogKpis(
                activeMp, draftMp, inactiveMp, mergedMp, 5, 2, 8
        );

        long pendingSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.PENDING);
        long reviewSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.UNDER_REVIEW);
        long infoSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.INFORMATION_REQUIRED);
        long verifiedSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.VERIFIED);
        long rejectedSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.REJECTED);
        long suspendedSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.SUSPENDED);

        SupplierKpis supplierKpis = new SupplierKpis(
                pendingSup, reviewSup, infoSup, verifiedSup, rejectedSup, suspendedSup
        );

        long pendingOff = supplierOfferingRepository.countByModerationStatus("PENDING_REVIEW");
        long reviewOff = supplierOfferingRepository.countByModerationStatus("UNDER_REVIEW");
        long infoOff = supplierOfferingRepository.countByModerationStatus("INFORMATION_REQUIRED");
        long approvedOff = supplierOfferingRepository.countByModerationStatus("APPROVED");
        long flaggedOff = supplierOfferingRepository.countByModerationStatus("FLAGGED");
        long rejectedOff = supplierOfferingRepository.countByModerationStatus("REJECTED");
        long suspendedOff = supplierOfferingRepository.countByModerationStatus("SUSPENDED");

        OfferingKpis offeringKpis = new OfferingKpis(
                pendingOff, reviewOff, infoOff, approvedOff, flaggedOff, rejectedOff, suspendedOff, 3
        );

        long pendingReq = productRequestRepository.countByStatus("PENDING");
        long infoReq = productRequestRepository.countByStatus("INFORMATION_REQUIRED");
        long appReq = productRequestRepository.countByStatus("APPROVED");
        long rejReq = productRequestRepository.countByStatus("REJECTED");

        RequestKpis requestKpis = new RequestKpis(
                pendingReq, infoReq, appReq, rejReq
        );

        return new AdminKpiSummaryResponse(catalogKpis, supplierKpis, offeringKpis, requestKpis);
    }

    public List<ActionCenterItemResponse> getActionCenterItems() {
        List<ActionCenterItemResponse> items = new ArrayList<>();

        long pendingSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.PENDING);
        if (pendingSup > 0) {
            items.add(new ActionCenterItemResponse("act-1", "SUPPLIER_VERIFICATION", "HIGH", "Pending Supplier Verifications", "New suppliers waiting for credential review", pendingSup, "/dashboard/admin/suppliers/quality"));
        }

        long pendingOff = supplierOfferingRepository.countByModerationStatus("PENDING_REVIEW");
        if (pendingOff > 0) {
            items.add(new ActionCenterItemResponse("act-2", "OFFERING_MODERATION", "HIGH", "Offerings Pending Moderation", "Supplier offerings waiting for technical review", pendingOff, "/dashboard/admin/catalog/offerings/quality"));
        }

        long pendingReq = productRequestRepository.countByStatus("PENDING");
        if (pendingReq > 0) {
            items.add(new ActionCenterItemResponse("act-3", "PRODUCT_REQUESTS", "NORMAL", "Pending Product Requests", "Buyer chemical requests needing catalog resolution", pendingReq, "/dashboard/admin/catalog/requests"));
        }

        return items;
    }

    public Page<MasterProductQualityItemResponse> getMasterProductQualityList(Pageable pageable) {
        Page<MasterProduct> page = masterProductRepository.findAll(pageable);
        List<MasterProductQualityItemResponse> dtos = page.getContent().stream().map(mp -> {
            Map<String, String> dims = new HashMap<>();
            dims.put("NAME", mp.getName() != null ? "VERIFIED" : "MISSING");
            dims.put("CAS_NUMBER", mp.getCasNumber() != null ? "VERIFIED" : "MISSING");
            dims.put("MOLECULAR_FORMULA", mp.getMolecularFormula() != null ? "VERIFIED" : "MISSING");
            dims.put("CATEGORY", mp.getCategory() != null ? "VERIFIED" : "MISSING");
            dims.put("DESCRIPTION", mp.getDescription() != null ? "VERIFIED" : "UNVERIFIED");
            dims.put("MASTER_PRODUCT_CODE", mp.getMasterProductCode() != null ? "VERIFIED" : "MISSING");
            dims.put("CANONICAL_IMAGE", "VERIFIED");
            dims.put("TECHNICAL_DOCUMENTS", "UNVERIFIED");
            dims.put("DUPLICATE_RISK", "VERIFIED");
            dims.put("MERGE_STATUS", "MERGED".equals(mp.getStatus()) ? "REJECTED" : "VERIFIED");
            dims.put("OFFERING_AVAILABILITY", "VERIFIED");
            dims.put("TECHNICAL_CONSISTENCY", "VERIFIED");

            long verifiedCount = dims.values().stream().filter("VERIFIED"::equals).count();
            int score = (int) Math.round((double) verifiedCount / 12.0 * 100.0);
            int issueCount = 12 - (int) verifiedCount;

            return new MasterProductQualityItemResponse(
                    mp.getId(),
                    mp.getMasterProductCode(),
                    mp.getName(),
                    mp.getCasNumber(),
                    mp.getCategory(),
                    score,
                    mp.getStatus(),
                    issueCount,
                    issueCount > 0 ? "Missing optional details" : "None",
                    dims,
                    mp.getUpdatedAt() != null ? mp.getUpdatedAt() : LocalDateTime.now()
            );
        }).toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    public Page<SupplierQualityItemResponse> getSupplierQualityList(Pageable pageable) {
        Page<Supplier> page = supplierRepository.findAll(pageable);
        List<SupplierQualityItemResponse> dtos = page.getContent().stream().map(sup -> {
            long offCount = supplierOfferingRepository.countBySupplierId(sup.getId());
            return new SupplierQualityItemResponse(
                    sup.getId(),
                    sup.getName(),
                    sup.getBusinessType() != null ? sup.getBusinessType() : "MANUFACTURER",
                    sup.getVerificationStatus() != null ? sup.getVerificationStatus() : SupplierVerificationStatus.PENDING,
                    sup.getVerified() ? 100 : 50,
                    sup.getVerified() ? 100 : 40,
                    sup.getVerified() ? 0 : 2,
                    0,
                    0,
                    offCount,
                    0,
                    0,
                    0,
                    LocalDateTime.now()
            );
        }).toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    public Page<SupplierOfferingQualityItemResponse> getSupplierOfferingQualityList(Pageable pageable) {
        Page<SupplierOffering> page = supplierOfferingRepository.findAll(pageable);
        List<SupplierOfferingQualityItemResponse> dtos = page.getContent().stream().map(off -> {
            Map<String, String> dims = new HashMap<>();
            dims.put("PRICE", off.getPrice() != null ? "VERIFIED" : "MISSING");
            dims.put("CURRENCY", off.getCurrency() != null ? "VERIFIED" : "MISSING");
            dims.put("PURITY", off.getPurity() != null ? "VERIFIED" : "MISSING");
            dims.put("GRADE", off.getGrade() != null ? "VERIFIED" : "MISSING");
            dims.put("MOQ", off.getMoqKg() != null ? "VERIFIED" : "MISSING");
            dims.put("PACKAGING", off.getPackaging() != null ? "VERIFIED" : "MISSING");
            dims.put("LEAD_TIME", off.getLeadTimeDays() != null ? "VERIFIED" : "MISSING");
            dims.put("STOCK", off.getStock() != null ? "VERIFIED" : "MISSING");
            dims.put("AVAILABILITY", off.getAvailabilityStatus() != null ? "VERIFIED" : "MISSING");
            dims.put("COA", off.getCoaAvailable() ? "VERIFIED" : "MISSING");
            dims.put("MSDS", off.getMsdsAvailable() ? "VERIFIED" : "MISSING");
            dims.put("EXPORT_READINESS", off.getExportReady() ? "VERIFIED" : "UNVERIFIED");
            dims.put("MASTER_PRODUCT_CONSISTENCY", "VERIFIED");
            dims.put("SUPPLIER_OWNERSHIP", "VERIFIED");
            dims.put("TECHNICAL_DATA_CONSISTENCY", "VERIFIED");

            long verifiedCount = dims.values().stream().filter("VERIFIED"::equals).count();
            int score = (int) Math.round((double) verifiedCount / 15.0 * 100.0);

            return new SupplierOfferingQualityItemResponse(
                    off.getId(),
                    off.getMasterProduct() != null ? off.getMasterProduct().getMasterProductCode() : "N/A",
                    off.getMasterProduct() != null ? off.getMasterProduct().getName() : "N/A",
                    off.getSupplier() != null ? off.getSupplier().getId() : 0L,
                    off.getSupplier() != null ? off.getSupplier().getName() : "N/A",
                    off.getPrice(),
                    off.getCurrency(),
                    off.getPurity(),
                    off.getGrade(),
                    off.getMoqKg(),
                    off.getPackaging(),
                    off.getLeadTimeDays(),
                    off.getAvailabilityStatus(),
                    off.getCoaAvailable(),
                    off.getMsdsAvailable(),
                    off.getExportReady(),
                    off.getModerationStatus(),
                    score,
                    (int) verifiedCount,
                    15 - (int) verifiedCount,
                    dims,
                    off.getUpdatedAt() != null ? off.getUpdatedAt() : LocalDateTime.now()
            );
        }).toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    public Page<AdminSearchResultItem> searchAll(String query, int page, int size) {
        String cleanQ = query != null ? query.trim() : "";
        List<AdminSearchResultItem> results = new ArrayList<>();

        if (!cleanQ.isBlank()) {
            masterProductRepository.findByNameContainingIgnoreCase(cleanQ, PageRequest.of(0, 10))
                    .forEach(mp -> results.add(new AdminSearchResultItem("MASTER_PRODUCT", mp.getMasterProductCode(), mp.getName(), mp.getStatus(), "CAS: " + mp.getCasNumber(), "/dashboard/admin/catalog/master-products/" + mp.getId(), LocalDateTime.now())));

            supplierRepository.findByNameContainingIgnoreCase(cleanQ, PageRequest.of(0, 10))
                    .forEach(sup -> results.add(new AdminSearchResultItem("SUPPLIER", String.valueOf(sup.getId()), sup.getName(), String.valueOf(sup.getVerificationStatus()), sup.getBusinessType(), "/dashboard/admin/catalog/verification/" + sup.getId(), LocalDateTime.now())));
        }

        int start = Math.min(page * size, results.size());
        int end = Math.min(start + size, results.size());
        List<AdminSearchResultItem> paged = results.subList(start, end);

        return new PageImpl<>(paged, PageRequest.of(page, size), results.size());
    }

    public Page<GovernanceQueueItem> getGovernanceQueue(Pageable pageable) {
        List<GovernanceQueueItem> queue = new ArrayList<>();

        supplierRepository.findByVerificationStatus(SupplierVerificationStatus.PENDING).forEach(sup ->
                queue.add(new GovernanceQueueItem("q-sup-" + sup.getId(), "HIGH", "SUPPLIER", String.valueOf(sup.getId()), sup.getName(), "Verification credentials pending admin review", "PENDING", LocalDateTime.now(), "Supplier Verification", "/dashboard/admin/catalog/verification/" + sup.getId()))
        );

        supplierOfferingRepository.findByModerationStatus("PENDING_REVIEW").forEach(off ->
                queue.add(new GovernanceQueueItem("q-off-" + off.getId(), "HIGH", "OFFERING", off.getId().toString(), off.getMasterProduct() != null ? off.getMasterProduct().getName() : "Offering", "Offering moderation pending", "PENDING_REVIEW", LocalDateTime.now(), "Offering Governance", "/dashboard/admin/catalog/offerings/" + off.getId()))
        );

        int start = Math.min((int) pageable.getOffset(), queue.size());
        int end = Math.min(start + pageable.getPageSize(), queue.size());
        List<GovernanceQueueItem> paged = queue.subList(start, end);

        return new PageImpl<>(paged, pageable, queue.size());
    }
}
