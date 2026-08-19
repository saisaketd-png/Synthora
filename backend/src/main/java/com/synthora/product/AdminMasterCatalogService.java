package com.synthora.product;

import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditService;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.common.ResourceNotFoundException;
import com.synthora.governance.GovernanceAction;
import com.synthora.governance.GovernanceAuditLog;
import com.synthora.governance.GovernanceAuditLogRepository;
import com.synthora.governance.dto.GovernanceAuditLogResponse;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationService;
import com.synthora.notification.NotificationType;
import com.synthora.product.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AdminMasterCatalogService {

    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final ProductRequestRepository productRequestRepository;
    private final UserRepository userRepository;
    private final MasterProductCodeGenerator codeGenerator;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final GovernanceAuditLogRepository governanceAuditLogRepository;

    public AdminMasterCatalogService(
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            ProductRequestRepository productRequestRepository,
            UserRepository userRepository,
            MasterProductCodeGenerator codeGenerator,
            NotificationService notificationService,
            AuditService auditService,
            GovernanceAuditLogRepository governanceAuditLogRepository) {
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.productRequestRepository = productRequestRepository;
        this.userRepository = userRepository;
        this.codeGenerator = codeGenerator;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.governanceAuditLogRepository = governanceAuditLogRepository;
    }

    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchAdminMasterProducts(AdminMasterProductSearchCriteria criteria, Pageable pageable, Authentication authentication) {
        resolveAdmin(authentication);
        var spec = AdminMasterProductSpecification.createSpecification(criteria);
        return masterProductRepository.findAll(spec, pageable).map(this::toMasterProductResponse);
    }

    @Transactional(readOnly = true)
    public GovernanceStatsResponse getGovernanceStats(Authentication authentication) {
        resolveAdmin(authentication);
        long activeCount = masterProductRepository.count();
        long pendingCount = productRequestRepository.findByStatus("PENDING_REVIEW", Pageable.unpaged()).getTotalElements();
        long approvedCount = productRequestRepository.findByStatus("APPROVED", Pageable.unpaged()).getTotalElements();
        long rejectedCount = productRequestRepository.findByStatus("REJECTED", Pageable.unpaged()).getTotalElements();
        long offeringsCount = supplierOfferingRepository.count();

        List<DuplicateCandidateResponse> dupes = findDuplicateCandidatesInternal();

        return new GovernanceStatsResponse(
                activeCount,
                pendingCount,
                approvedCount,
                rejectedCount,
                dupes.size(),
                offeringsCount
        );
    }

    @Transactional(readOnly = true)
    public Page<ProductRequestResponse> getRequestsByStatus(String status, Pageable pageable, Authentication authentication) {
        resolveAdmin(authentication);
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return productRequestRepository.findAll(pageable).map(this::toRequestResponse);
        }
        return productRequestRepository.findByStatus(status.toUpperCase(), pageable).map(this::toRequestResponse);
    }

    public MasterProductResponse createMasterProduct(CreateMasterProductPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        String cleanCas = payload.casNumber() != null ? payload.casNumber().trim() : null;

        if (cleanCas != null && !cleanCas.isBlank()) {
            Optional<MasterProduct> existing = masterProductRepository.findByCasNumberAndCategory(cleanCas, payload.category());
            if (existing.isPresent()) {
                throw new IllegalStateException("A MasterProduct already exists for CAS " + cleanCas + " in category " + payload.category());
            }
        }

        MasterProduct mp = new MasterProduct();
        mp.setName(payload.name().trim());
        mp.setMasterProductCode(codeGenerator.generateMasterProductCode(payload.category()));
        mp.setCasNumber(cleanCas);
        mp.setMolecularFormula(payload.molecularFormula() != null ? payload.molecularFormula().trim() : null);
        mp.setCategory(payload.category());
        mp.setDescription(payload.description() != null ? payload.description().trim() : null);
        mp.setStatus(payload.status() != null && !payload.status().isBlank() ? payload.status().trim().toUpperCase() : "ACTIVE");

        MasterProduct savedMp = masterProductRepository.save(mp);

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_CREATED, "MASTER_PRODUCT", savedMp.getId().toString(), null, savedMp.getStatus(), "Created canonical Master Product: " + savedMp.getName());

        return toMasterProductResponse(savedMp);
    }

    public MasterProductResponse updateMasterProduct(UUID id, UpdateMasterProductPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        MasterProduct mp = masterProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + id));

        String prevState = "Status: " + mp.getStatus() + ", Name: " + mp.getName() + ", CAS: " + mp.getCasNumber();

        if (payload.name() != null && !payload.name().isBlank()) mp.setName(payload.name().trim());
        if (payload.casNumber() != null) mp.setCasNumber(payload.casNumber().trim());
        if (payload.molecularFormula() != null) mp.setMolecularFormula(payload.molecularFormula().trim());
        if (payload.category() != null) mp.setCategory(payload.category());
        if (payload.description() != null) mp.setDescription(payload.description().trim());
        if (payload.status() != null && !payload.status().isBlank()) {
            if ("MERGED".equalsIgnoreCase(mp.getStatus())) {
                throw new IllegalStateException("Merged Master Products cannot be independently updated");
            }
            mp.setStatus(payload.status().trim().toUpperCase());
        }

        MasterProduct savedMp = masterProductRepository.save(mp);
        String newState = "Status: " + savedMp.getStatus() + ", Name: " + savedMp.getName() + ", CAS: " + savedMp.getCasNumber();

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "MASTER_PRODUCT", savedMp.getId().toString(), prevState, newState, payload.updateReason());

        return toMasterProductResponse(savedMp);
    }

    public ProductRequestResponse requestProductInformation(UUID requestId, RequestProductInfoPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        pr.setStatus("INFORMATION_REQUIRED");
        pr.setAdminRequestNotes(payload.adminNotes().trim());
        pr.setReviewedBy(admin);
        pr.setReviewedAt(LocalDateTime.now());
        ProductRequest saved = productRequestRepository.save(pr);

        recordGovernanceAudit(admin, GovernanceAction.PRODUCT_INFORMATION_REQUESTED, "PRODUCT_REQUEST", pr.getId().toString(), "PENDING_REVIEW", "INFORMATION_REQUIRED", payload.adminNotes());

        notificationService.createNotification(
                pr.getSupplier().getUser().getId(),
                NotificationType.PRODUCT_REQUEST_REJECTED,
                "Additional Information Required for Chemical Request",
                "Admin has requested information for your proposal '" + pr.getProposedName() + "': " + payload.adminNotes(),
                NotificationEntityType.PRODUCT_REQUEST,
                pr.getId()
        );

        return toRequestResponse(saved);
    }

    public ProductRequestResponse respondProductInformation(UUID requestId, RespondProductInfoPayload payload, Authentication authentication) {
        String email = authentication.getName();
        User supplierUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        if (!pr.getSupplier().getUser().getId().equals(supplierUser.getId())) {
            throw new AccessDeniedException("You do not own this Product Request");
        }

        pr.setStatus("PENDING_REVIEW");
        pr.setSupplierResponseNotes(payload.supplierResponseNotes().trim());
        if (payload.correctedName() != null && !payload.correctedName().isBlank()) pr.setProposedName(payload.correctedName().trim());
        if (payload.correctedCas() != null) pr.setCasNumber(payload.correctedCas().trim());
        if (payload.correctedFormula() != null) pr.setMolecularFormula(payload.correctedFormula().trim());

        ProductRequest saved = productRequestRepository.save(pr);

        recordGovernanceAudit(supplierUser, GovernanceAction.PRODUCT_REQUEST_RESPONDED, "PRODUCT_REQUEST", pr.getId().toString(), "INFORMATION_REQUIRED", "PENDING_REVIEW", payload.supplierResponseNotes());

        return toRequestResponse(saved);
    }

    public MasterProductResponse approveAndLinkRequest(UUID requestId, ApproveAndLinkPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        MasterProduct existingMp = masterProductRepository.findById(payload.existingMasterProductId())
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + payload.existingMasterProductId()));

        pr.setStatus("APPROVED");
        pr.setReviewedBy(admin);
        pr.setReviewedAt(LocalDateTime.now());
        productRequestRepository.save(pr);

        recordGovernanceAudit(admin, GovernanceAction.PRODUCT_REQUEST_APPROVED, "PRODUCT_REQUEST", pr.getId().toString(), "PENDING_REVIEW", "APPROVED", "Linked to existing MasterProduct " + existingMp.getMasterProductCode());

        notificationService.createNotification(
                pr.getSupplier().getUser().getId(),
                NotificationType.PRODUCT_REQUEST_APPROVED,
                "Chemical Request Approved & Linked",
                "Your chemical request for '" + pr.getProposedName() + "' has been approved and linked to Master Product (" + existingMp.getMasterProductCode() + ").",
                NotificationEntityType.MASTER_PRODUCT,
                existingMp.getId()
        );

        return toMasterProductResponse(existingMp);
    }

    public MasterProductResponse approveRequest(
            UUID requestId,
            ApproveProductRequestPayload payload,
            Authentication authentication) {

        User admin = resolveAdmin(authentication);
        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        if (!"PENDING_REVIEW".equalsIgnoreCase(pr.getStatus()) && !"INFORMATION_REQUIRED".equalsIgnoreCase(pr.getStatus())) {
            throw new IllegalStateException("ProductRequest is already processed: " + pr.getStatus());
        }

        String cleanCas = payload.casNumber() != null ? payload.casNumber().trim() : null;

        if (cleanCas != null && !cleanCas.isBlank()) {
            Optional<MasterProduct> existing = masterProductRepository.findByCasNumberAndCategory(cleanCas, payload.category());
            if (existing.isPresent()) {
                throw new IllegalStateException("A MasterProduct already exists for CAS " + cleanCas + " in category " + payload.category());
            }
        }

        MasterProduct mp = new MasterProduct();
        mp.setName(payload.canonicalName().trim());
        mp.setMasterProductCode(codeGenerator.generateMasterProductCode(payload.category()));
        mp.setCasNumber(cleanCas);
        mp.setMolecularFormula(payload.molecularFormula() != null ? payload.molecularFormula().trim() : null);
        mp.setCategory(payload.category());
        mp.setDescription(payload.description() != null ? payload.description().trim() : null);
        mp.setStatus("ACTIVE");

        MasterProduct savedMp = masterProductRepository.save(mp);

        pr.setStatus("APPROVED");
        pr.setReviewedBy(admin);
        pr.setReviewedAt(LocalDateTime.now());
        productRequestRepository.save(pr);

        recordGovernanceAudit(admin, GovernanceAction.PRODUCT_REQUEST_APPROVED, "PRODUCT_REQUEST", pr.getId().toString(), pr.getStatus(), "APPROVED", "Approved chemical proposal: " + savedMp.getName());

        auditService.record(
                authentication,
                AuditAction.PRODUCT_REQUEST_APPROVED,
                AuditTargetType.PRODUCT_REQUEST,
                pr.getId().toString(),
                "Approved chemical proposal: " + savedMp.getName() + " (" + savedMp.getMasterProductCode() + ")",
                "127.0.0.1"
        );

        notificationService.createNotification(
                pr.getSupplier().getUser().getId(),
                NotificationType.PRODUCT_REQUEST_APPROVED,
                "Chemical Request Approved",
                "Your chemical request for '" + savedMp.getName() + "' has been approved and added to the Master Catalog (" + savedMp.getMasterProductCode() + "). You can now attach your commercial offering.",
                NotificationEntityType.MASTER_PRODUCT,
                savedMp.getId()
        );

        return toMasterProductResponse(savedMp);
    }

    public ProductRequestResponse rejectRequest(
            UUID requestId,
            RejectProductRequestPayload payload,
            Authentication authentication) {

        User admin = resolveAdmin(authentication);
        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        pr.setStatus("REJECTED");
        pr.setRejectionReason(payload.rejectionReason().trim());
        pr.setReviewedBy(admin);
        pr.setReviewedAt(LocalDateTime.now());

        ProductRequest saved = productRequestRepository.save(pr);

        recordGovernanceAudit(admin, GovernanceAction.PRODUCT_REQUEST_REJECTED, "PRODUCT_REQUEST", pr.getId().toString(), "PENDING_REVIEW", "REJECTED", payload.rejectionReason());

        auditService.record(
                authentication,
                AuditAction.PRODUCT_REQUEST_REJECTED,
                AuditTargetType.PRODUCT_REQUEST,
                pr.getId().toString(),
                "Rejected chemical proposal: " + pr.getProposedName() + ". Reason: " + payload.rejectionReason(),
                "127.0.0.1"
        );

        notificationService.createNotification(
                pr.getSupplier().getUser().getId(),
                NotificationType.PRODUCT_REQUEST_REJECTED,
                "Chemical Request Status Update",
                "Your chemical request for '" + pr.getProposedName() + "' was reviewed. Reason: " + payload.rejectionReason(),
                NotificationEntityType.PRODUCT_REQUEST,
                pr.getId()
        );

        return toRequestResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DuplicateCandidateResponse> findDuplicateCandidates(Authentication authentication) {
        resolveAdmin(authentication);
        return findDuplicateCandidatesInternal();
    }

    private List<DuplicateCandidateResponse> findDuplicateCandidatesInternal() {
        List<MasterProduct> all = masterProductRepository.findAll();
        List<DuplicateCandidateResponse> candidates = new ArrayList<>();

        for (int i = 0; i < all.size(); i++) {
            for (int j = i + 1; j < all.size(); j++) {
                MasterProduct a = all.get(i);
                MasterProduct b = all.get(j);

                if ("MERGED".equalsIgnoreCase(a.getStatus()) || "MERGED".equalsIgnoreCase(b.getStatus())) {
                    continue;
                }

                if (a.getCasNumber() != null && !a.getCasNumber().isBlank()
                        && a.getCasNumber().equalsIgnoreCase(b.getCasNumber())) {

                    String confidence = a.getCategory() == b.getCategory() ? "HIGH" : "MEDIUM";
                    candidates.add(new DuplicateCandidateResponse(
                            a.getId(), a.getMasterProductCode(), a.getName(), a.getCasNumber(), a.getMolecularFormula(),
                            b.getId(), b.getMasterProductCode(), b.getName(), b.getCasNumber(), b.getMolecularFormula(),
                            confidence,
                            "Matching CAS Registry Number: " + a.getCasNumber()
                    ));
                }
                else if (a.getName().equalsIgnoreCase(b.getName())
                        && a.getMolecularFormula() != null
                        && a.getMolecularFormula().equalsIgnoreCase(b.getMolecularFormula())) {

                    candidates.add(new DuplicateCandidateResponse(
                            a.getId(), a.getMasterProductCode(), a.getName(), a.getCasNumber(), a.getMolecularFormula(),
                            b.getId(), b.getMasterProductCode(), b.getName(), b.getCasNumber(), b.getMolecularFormula(),
                            "MEDIUM",
                            "Matching Chemical Name & Formula: " + a.getName()
                    ));
                }
            }
        }
        return candidates;
    }

    public MasterProductResponse mergeMasterProducts(
            MergeMasterProductsPayload payload,
            Authentication authentication) {

        User admin = resolveAdmin(authentication);

        if (payload.sourceMasterProductId().equals(payload.targetMasterProductId())) {
            throw new IllegalArgumentException("Source and target MasterProducts cannot be identical.");
        }

        MasterProduct source = masterProductRepository.findById(payload.sourceMasterProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Source MasterProduct not found: " + payload.sourceMasterProductId()));

        MasterProduct target = masterProductRepository.findById(payload.targetMasterProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Target MasterProduct not found: " + payload.targetMasterProductId()));

        if ("MERGED".equalsIgnoreCase(source.getStatus())) {
            throw new IllegalStateException("Source MasterProduct is already merged into " + source.getMergedIntoMasterProduct().getMasterProductCode());
        }

        List<SupplierOffering> sourceOfferings = supplierOfferingRepository.findByMasterProductId(source.getId());
        for (SupplierOffering off : sourceOfferings) {
            Optional<SupplierOffering> existingTargetOffering = supplierOfferingRepository.findByMasterProductIdAndSupplierId(target.getId(), off.getSupplier().getId());
            if (existingTargetOffering.isPresent()) {
                off.setAvailabilityStatus("HIDDEN");
            } else {
                off.setMasterProduct(target);
            }
            supplierOfferingRepository.save(off);
        }

        source.setStatus("MERGED");
        source.setMergedIntoMasterProduct(target);
        source.setDeactivatedAt(LocalDateTime.now());
        source.setDeactivatedBy(admin);
        masterProductRepository.save(source);

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_MERGED, "MASTER_PRODUCT", source.getId().toString(), "ACTIVE", "MERGED", payload.adminNotes());

        return toMasterProductResponse(target);
    }

    public MasterProductResponse setMasterProductStatus(
            UUID masterProductId,
            String newStatus,
            Authentication authentication) {

        User admin = resolveAdmin(authentication);
        MasterProduct mp = masterProductRepository.findById(masterProductId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + masterProductId));

        if ("MERGED".equalsIgnoreCase(mp.getStatus())) {
            throw new IllegalStateException("Merged Master Products cannot be independently reactivated");
        }

        String prevStatus = mp.getStatus();
        String upper = newStatus.trim().toUpperCase();
        mp.setStatus(upper);
        if ("INACTIVE".equals(upper)) {
            mp.setDeactivatedAt(LocalDateTime.now());
            mp.setDeactivatedBy(admin);
        }
        MasterProduct saved = masterProductRepository.save(mp);

        GovernanceAction gAction = "ACTIVE".equalsIgnoreCase(upper) ? GovernanceAction.MASTER_PRODUCT_ACTIVATED : GovernanceAction.MASTER_PRODUCT_DEACTIVATED;
        recordGovernanceAudit(admin, gAction, "MASTER_PRODUCT", mp.getId().toString(), prevStatus, upper, "Status changed to " + upper);

        return toMasterProductResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GovernanceAuditLogResponse> getAuditLogsForEntity(String entityType, String entityId, Authentication authentication) {
        resolveAdmin(authentication);
        return governanceAuditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId)
                .stream()
                .map(this::toAuditResponse)
                .toList();
    }

    private void recordGovernanceAudit(User actor, GovernanceAction action, String entityType, String entityId, String prev, String next, String reason) {
        GovernanceAuditLog log = new GovernanceAuditLog(actor.getId(), actor.getName(), actor.getEmail(), action, entityType, entityId, prev, next, reason);
        governanceAuditLogRepository.save(log);
    }

    private GovernanceAuditLogResponse toAuditResponse(GovernanceAuditLog log) {
        return new GovernanceAuditLogResponse(
                log.getId(),
                log.getActorId(),
                log.getActorName(),
                log.getActorEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getPreviousState(),
                log.getNewState(),
                log.getReason(),
                log.getTimestamp()
        );
    }

    public MasterProductDetailResponse getMasterProductDetail(UUID id, Authentication authentication) {
        resolveAdmin(authentication);
        MasterProduct mp = masterProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + id));

        List<SupplierOfferingResponse> offerings = mp.getOfferings() != null
                ? mp.getOfferings().stream().map(this::toSupplierOfferingResponse).toList()
                : List.of();

        List<GovernanceAuditLogResponse> logs = governanceAuditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc("MASTER_PRODUCT", id.toString())
                .stream().map(this::toAuditResponse).toList();

        return new MasterProductDetailResponse(
                mp.getId(),
                mp.getMasterProductCode(),
                mp.getName(),
                mp.getCasNumber(),
                mp.getMolecularFormula(),
                mp.getCategory(),
                mp.getDescription(),
                mp.getStatus(),
                offerings.size(),
                mp.getCreatedAt(),
                mp.getUpdatedAt(),
                offerings,
                List.of(),
                logs,
                List.of(),
                List.of()
        );
    }

    public MasterProductResponse verifyChemicalField(UUID id, VerifyChemicalFieldPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        MasterProduct mp = masterProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + id));

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "MASTER_PRODUCT", mp.getId().toString(),
                "FIELD_VERIFICATION", payload.status(), "Verified field " + payload.fieldName() + ". Notes: " + payload.notes());

        return toMasterProductResponse(mp);
    }

    public Page<SupplierOfferingResponse> searchSupplierOfferings(String query, Boolean flagged, Pageable pageable, Authentication authentication) {
        resolveAdmin(authentication);
        return supplierOfferingRepository.findAll(pageable).map(this::toSupplierOfferingResponse);
    }

    public SupplierOfferingResponse flagSupplierOffering(UUID offeringId, FlagOfferingPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        if (payload.flagged()) {
            offering.setAvailabilityStatus("FLAGGED");
        } else {
            offering.setAvailabilityStatus("AVAILABLE");
        }
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "SUPPLIER_OFFERING", offering.getId().toString(),
                "AVAILABLE", offering.getAvailabilityStatus(), payload.reason());

        return toSupplierOfferingResponse(saved);
    }

    private SupplierOfferingResponse toSupplierOfferingResponse(SupplierOffering o) {
        MasterProduct mp = o.getMasterProduct();
        return new SupplierOfferingResponse(
                o.getId(),
                mp != null ? mp.getId() : null,
                mp != null ? mp.getMasterProductCode() : null,
                mp != null ? mp.getName() : null,
                mp != null ? mp.getCasNumber() : null,
                mp != null ? mp.getMolecularFormula() : null,
                mp != null && mp.getCategory() != null ? mp.getCategory().name() : null,
                o.getSupplier() != null ? o.getSupplier().getId() : null,
                o.getSupplier() != null ? o.getSupplier().getName() : null,
                o.getPrice(),
                o.getCurrency(),
                o.getStock(),
                o.getPurity(),
                o.getGrade(),
                o.getMoqKg(),
                o.getPackaging(),
                o.getLeadTimeDays(),
                o.getCoaAvailable(),
                o.getMsdsAvailable(),
                o.getExportReady(),
                o.getAvailabilityStatus(),
                o.getModerationStatus() != null ? o.getModerationStatus() : "PENDING_REVIEW",
                o.getModerationNotes(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }

    public Page<GovernanceAuditLogResponse> getAllAuditLogs(String entityType, Pageable pageable, Authentication authentication) {
        resolveAdmin(authentication);
        if (entityType != null && !entityType.isBlank()) {
            return governanceAuditLogRepository.findAll(pageable)
                    .map(this::toAuditResponse);
        }
        return governanceAuditLogRepository.findAll(pageable).map(this::toAuditResponse);
    }

    private User resolveAdmin(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!user.getRole().name().equalsIgnoreCase("ADMIN")) {
            throw new AccessDeniedException("Admin role required for catalog governance");
        }
        return user;
    }

    private ProductRequestResponse toRequestResponse(ProductRequest pr) {
        return new ProductRequestResponse(
                pr.getId(),
                pr.getSupplier().getId(),
                pr.getSupplier().getName(),
                pr.getProposedName(),
                pr.getCasNumber(),
                pr.getMolecularFormula(),
                pr.getCategory(),
                pr.getDescription(),
                pr.getSupplierMessage(),
                pr.getStatus(),
                pr.getCreatedAt(),
                pr.getUpdatedAt()
        );
    }

    private MasterProductResponse toMasterProductResponse(MasterProduct mp) {
        int count = mp.getOfferings() != null ? mp.getOfferings().size() : 0;
        return new MasterProductResponse(
                mp.getId(),
                mp.getMasterProductCode(),
                mp.getName(),
                mp.getCasNumber(),
                mp.getMolecularFormula(),
                mp.getCategory(),
                mp.getDescription(),
                mp.getStatus(),
                count,
                mp.getCreatedAt(),
                mp.getUpdatedAt()
        );
    }
}
