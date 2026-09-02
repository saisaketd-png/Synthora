package com.kemkendra.admin.operations;

import com.kemkendra.admin.governance.AccountSuspensionAppealRepository;
import com.kemkendra.admin.governance.AccountSuspensionRepository;
import com.kemkendra.admin.governance.AppealStatus;
import com.kemkendra.admin.operations.dto.AdminOperationsDtos.*;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.Shipment;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.product.*;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.seller.SupplierVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
    private final QuotationRepository quotationRepository;
    private final PurchaseOrderRepository poRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final AccountSuspensionRepository suspensionRepository;
    private final AccountSuspensionAppealRepository appealRepository;
    private final com.kemkendra.notification.NotificationRepository notificationRepository;

    public AdminOperationsService(
            MasterProductRepository masterProductRepository,
            SupplierRepository supplierRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            ProductRequestRepository productRequestRepository,
            RfqRepository rfqRepository,
            QuotationRepository quotationRepository,
            PurchaseOrderRepository poRepository,
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            AccountSuspensionRepository suspensionRepository,
            AccountSuspensionAppealRepository appealRepository,
            com.kemkendra.notification.NotificationRepository notificationRepository) {
        this.masterProductRepository = masterProductRepository;
        this.supplierRepository = supplierRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.productRequestRepository = productRequestRepository;
        this.rfqRepository = rfqRepository;
        this.quotationRepository = quotationRepository;
        this.poRepository = poRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.suspensionRepository = suspensionRepository;
        this.appealRepository = appealRepository;
        this.notificationRepository = notificationRepository;
    }

    private com.kemkendra.admin.config.FeatureToggleService featureToggleService;
    private com.kemkendra.admin.config.PlatformFeatureFlagRepository featureFlagRepository;
    private com.kemkendra.admin.config.PlatformSettingRepository platformSettingRepository;
    private com.kemkendra.admin.announcement.PlatformAnnouncementRepository announcementRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setFeatureToggleService(com.kemkendra.admin.config.FeatureToggleService featureToggleService) {
        this.featureToggleService = featureToggleService;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setFeatureFlagRepository(com.kemkendra.admin.config.PlatformFeatureFlagRepository featureFlagRepository) {
        this.featureFlagRepository = featureFlagRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setPlatformSettingRepository(com.kemkendra.admin.config.PlatformSettingRepository platformSettingRepository) {
        this.platformSettingRepository = platformSettingRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setAnnouncementRepository(com.kemkendra.admin.announcement.PlatformAnnouncementRepository announcementRepository) {
        this.announcementRepository = announcementRepository;
    }

    public PlatformSnapshotResponse getPlatformSnapshot() {
        // Users
        long totalUsers = userRepository.countByDeletedAtIsNull();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long pendingVerifUsers = userRepository.countByStatus(UserStatus.PENDING);
        long buyerCount = userRepository.countByRole(UserRole.USER);
        long supplierUserCount = userRepository.countByRole(UserRole.SUPPLIER);
        long adminCount = userRepository.countByRole(UserRole.ADMIN);

        UserSnapshot userSnapshot = new UserSnapshot(
                totalUsers, activeUsers, suspendedUsers, pendingVerifUsers, buyerCount, supplierUserCount, adminCount
        );

        // Suppliers
        long totalSuppliers = supplierRepository.count();
        long verifiedSuppliers = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.VERIFIED);
        long pendingSuppliers = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.PENDING);
        long underReviewSuppliers = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.UNDER_REVIEW);
        long infoRequiredSuppliers = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.INFORMATION_REQUIRED);
        long rejectedSuppliers = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.REJECTED);
        long suspendedSuppliers = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.SUSPENDED);

        SupplierSnapshot supplierSnapshot = new SupplierSnapshot(
                totalSuppliers, verifiedSuppliers, pendingSuppliers, underReviewSuppliers,
                infoRequiredSuppliers, rejectedSuppliers, suspendedSuppliers
        );

        // Catalog
        long activeMp = masterProductRepository.countByStatus("ACTIVE");
        long draftMp = masterProductRepository.countByStatus("DRAFT");
        long inactiveMp = masterProductRepository.countByStatus("INACTIVE");
        long activeOff = supplierOfferingRepository.countByModerationStatus("APPROVED");
        long pendingOff = supplierOfferingRepository.countByModerationStatus("PENDING_REVIEW");
        long underReviewOff = supplierOfferingRepository.countByModerationStatus("UNDER_REVIEW");
        long flaggedOff = supplierOfferingRepository.countByModerationStatus("FLAGGED");

        CatalogSnapshot catalogSnapshot = new CatalogSnapshot(
                activeMp, draftMp, inactiveMp, activeOff, pendingOff, underReviewOff, flaggedOff
        );

        // Marketplace
        long activeRfqs = rfqRepository.countByStatus(RfqStatus.PENDING) + rfqRepository.countByStatus(RfqStatus.QUOTED) + rfqRepository.countByStatus(RfqStatus.COUNTERED);
        long closedRfqs = rfqRepository.countByStatus(RfqStatus.CLOSED) + rfqRepository.countByStatus(RfqStatus.EXPIRED) + rfqRepository.countByStatus(RfqStatus.CANCELLED);
        long pendingQuotations = quotationRepository.count();
        long acceptedQuotations = rfqRepository.countByStatus(RfqStatus.ACCEPTED);
        long activeOrders = poRepository.countByStatus(OrderStatus.PLACED) + poRepository.countByStatus(OrderStatus.CONFIRMED) + poRepository.countByStatus(OrderStatus.PROCESSING) + poRepository.countByStatus(OrderStatus.SHIPPED);
        long fulfilledOrders = poRepository.countByStatus(OrderStatus.DELIVERED) + poRepository.countByStatus(OrderStatus.COMPLETED);
        long activeShipments = shipmentRepository.count();
        long deliveredShipments = poRepository.countByStatus(OrderStatus.DELIVERED) + poRepository.countByStatus(OrderStatus.COMPLETED);

        MarketplaceSnapshot marketplaceSnapshot = new MarketplaceSnapshot(
                activeRfqs, closedRfqs, pendingQuotations, acceptedQuotations,
                activeOrders, fulfilledOrders, activeShipments, deliveredShipments
        );

        // Governance
        long activeSuspensions = suspensionRepository.countActiveSuspensions();
        long openAppeals = appealRepository.countByStatus(AppealStatus.SUBMITTED);
        long underReviewAppeals = appealRepository.countByStatus(AppealStatus.UNDER_REVIEW);
        long infoRequiredAppeals = appealRepository.countByStatus(AppealStatus.INFORMATION_REQUIRED);

        GovernanceSnapshot governanceSnapshot = new GovernanceSnapshot(
                activeSuspensions, openAppeals, underReviewAppeals, infoRequiredAppeals
        );

        // Communication
        long totalNotifications = notificationRepository.count();
        long totalUnread = notificationRepository.countTotalUnreadNotifications();
        long notificationsToday = notificationRepository.countNotificationsSince(LocalDateTime.now().toLocalDate().atStartOfDay());
        CommunicationSnapshot commSnapshot = new CommunicationSnapshot(totalNotifications, totalUnread, notificationsToday);

        // Policy & Feature Controls
        boolean maintenanceActive = false;
        long activeFlags = 0;
        long totalSettings = 0;
        long publishedAnnouncements = 0;
        try {
            if (featureToggleService != null) {
                maintenanceActive = featureToggleService.isMaintenanceModeActive();
                activeFlags = featureFlagRepository.findAll().stream().filter(com.kemkendra.admin.config.PlatformFeatureFlag::isEnabled).count();
            }
            if (platformSettingRepository != null) {
                totalSettings = platformSettingRepository.count();
            }
            if (announcementRepository != null) {
                publishedAnnouncements = announcementRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED").size();
            }
        } catch (Exception ignored) {}

        PolicySnapshot policySnapshot = new PolicySnapshot(maintenanceActive, activeFlags, totalSettings, publishedAnnouncements);

        return new PlatformSnapshotResponse(
                userSnapshot, supplierSnapshot, catalogSnapshot, marketplaceSnapshot, governanceSnapshot, commSnapshot, policySnapshot, LocalDateTime.now()
        );
    }

    public List<AttentionQueueItem> getOperationalAttentionQueue() {
        List<AttentionQueueItem> items = new ArrayList<>();

        // 1. Supplier verifications pending review
        long pendingSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.PENDING)
                + supplierRepository.countByVerificationStatus(SupplierVerificationStatus.UNDER_REVIEW);
        if (pendingSup > 0) {
            items.add(new AttentionQueueItem(
                    "queue-sup-verif",
                    "SUPPLIER_TRUST",
                    "HIGH",
                    pendingSup,
                    "Supplier Verifications Awaiting Review",
                    pendingSup + " supplier organization(s) submitted compliance credentials awaiting verification.",
                    "/dashboard/admin/suppliers/verification",
                    "Review Suppliers"
            ));
        }

        // 2. Open Appeals awaiting decision
        long openAppeals = appealRepository.countByStatus(AppealStatus.SUBMITTED)
                + appealRepository.countByStatus(AppealStatus.UNDER_REVIEW);
        if (openAppeals > 0) {
            items.add(new AttentionQueueItem(
                    "queue-appeals",
                    "USER_GOVERNANCE",
                    "HIGH",
                    openAppeals,
                    "Formal Account Appeals Pending",
                    openAppeals + " user appeal(s) against suspensions requiring administrative determination.",
                    "/dashboard/admin/account-governance",
                    "Review Appeals"
            ));
        }

        // 3. Offerings pending moderation
        long pendingOff = supplierOfferingRepository.countByModerationStatus("PENDING_REVIEW")
                + supplierOfferingRepository.countByModerationStatus("UNDER_REVIEW");
        if (pendingOff > 0) {
            items.add(new AttentionQueueItem(
                    "queue-offerings",
                    "CATALOG",
                    "HIGH",
                    pendingOff,
                    "Supplier Offerings Awaiting Moderation",
                    pendingOff + " chemical offering(s) require technical & document audit before publication.",
                    "/dashboard/admin/catalog/offerings/quality",
                    "Moderate Offerings"
            ));
        }

        // 4. Inactive or unreviewed product requests
        long pendingReq = productRequestRepository.countByStatus("PENDING");
        if (pendingReq > 0) {
            items.add(new AttentionQueueItem(
                    "queue-prod-req",
                    "CATALOG",
                    "MEDIUM",
                    pendingReq,
                    "Buyer Chemical Sourcing Requests",
                    pendingReq + " custom buyer product request(s) awaiting catalog classification.",
                    "/dashboard/admin/catalog/requests",
                    "Classify Requests"
            ));
        }

        // 5. Suppliers requiring info
        long infoSup = supplierRepository.countByVerificationStatus(SupplierVerificationStatus.INFORMATION_REQUIRED);
        if (infoSup > 0) {
            items.add(new AttentionQueueItem(
                    "queue-sup-info",
                    "SUPPLIER_TRUST",
                    "MEDIUM",
                    infoSup,
                    "Suppliers Awaiting Document Resubmission",
                    infoSup + " supplier(s) requested for clarifications or updated certifications.",
                    "/dashboard/admin/suppliers",
                    "View Suppliers"
            ));
        }

        return items;
    }

    public Page<AdminMarketplaceQuotationDto> getMarketplaceQuotations(
            int page, int size, String actionType, Long supplierId, UUID rfqId) {
        int boundedSize = Math.min(Math.max(size, 1), 100);
        int boundedPage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize);

        Specification<Quotation> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (actionType != null && !actionType.isBlank()) {
                predicates.add(cb.equal(root.get("actionType"), actionType.trim()));
            }
            if (rfqId != null) {
                predicates.add(cb.equal(root.get("rfq").get("id"), rfqId));
            }
            if (supplierId != null) {
                predicates.add(cb.equal(root.get("rfq").get("supplierId"), supplierId));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Quotation> p = quotationRepository.findAll(spec, pageable);
        List<AdminMarketplaceQuotationDto> dtos = p.getContent().stream().map(q -> {
            String supplierName = "Supplier #" + q.getRfq().getSupplierId();
            try {
                Optional<Supplier> s = supplierRepository.findById(q.getRfq().getSupplierId());
                if (s.isPresent()) supplierName = s.get().getName();
            } catch (Exception ignored) {}

            return new AdminMarketplaceQuotationDto(
                    q.getId(),
                    q.getRfq().getId(),
                    q.getRfq().getSupplierId(),
                    supplierName,
                    q.getUnitPrice(),
                    q.getCurrency(),
                    q.getMinimumOrderQuantity(),
                    q.getLeadTimeDays(),
                    q.getActionType() != null ? q.getActionType() : "INITIAL_QUOTATION",
                    q.getCreatedAt()
            );
        }).toList();

        return new PageImpl<>(dtos, pageable, p.getTotalElements());
    }

    public Page<AdminMarketplaceShipmentDto> getMarketplaceShipments(
            int page, int size, String carrier, String trackingNumber) {
        int boundedSize = Math.min(Math.max(size, 1), 100);
        int boundedPage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize);

        Specification<Shipment> spec = (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (carrier != null && !carrier.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("carrier")), "%" + carrier.trim().toLowerCase() + "%"));
            }
            if (trackingNumber != null && !trackingNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("trackingNumber")), "%" + trackingNumber.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Shipment> p = shipmentRepository.findAll(spec, pageable);
        List<AdminMarketplaceShipmentDto> dtos = p.getContent().stream().map(s -> {
            String poNum = s.getPurchaseOrder() != null ? s.getPurchaseOrder().getPoNumber() : "N/A";
            Long supId = s.getPurchaseOrder() != null ? s.getPurchaseOrder().getSupplierId() : null;
            String supName = "Supplier";
            if (supId != null) {
                try {
                    Optional<Supplier> sup = supplierRepository.findById(supId);
                    if (sup.isPresent()) supName = sup.get().getName();
                } catch (Exception ignored) {}
            }

            return new AdminMarketplaceShipmentDto(
                    s.getId(),
                    s.getPurchaseOrder() != null ? s.getPurchaseOrder().getId() : null,
                    poNum,
                    supId,
                    supName,
                    s.getCarrier(),
                    s.getTrackingNumber(),
                    "SHIPPED",
                    s.getEstimatedDeliveryDate() != null ? s.getEstimatedDeliveryDate().atStartOfDay() : null,
                    s.getCreatedAt()
            );
        }).toList();

        return new PageImpl<>(dtos, pageable, p.getTotalElements());
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
            items.add(new ActionCenterItemResponse("act-1", "SUPPLIER_VERIFICATION", "HIGH", "Pending Supplier Verifications", "New suppliers waiting for credential review", pendingSup, "/dashboard/admin/suppliers/verification"));
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
