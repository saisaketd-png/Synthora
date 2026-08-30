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
    private final ProductSynonymRepository productSynonymRepository;
    private final CatalogImageService catalogImageService;
    private final MasterProductImageRepository masterProductImageRepository;
    private final com.synthora.document.DocumentRepository documentRepository;
    private final com.synthora.document.DocumentService documentService;
    private final SupplierRepository supplierRepository;

    public AdminMasterCatalogService(
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            ProductRequestRepository productRequestRepository,
            UserRepository userRepository,
            MasterProductCodeGenerator codeGenerator,
            NotificationService notificationService,
            AuditService auditService,
            GovernanceAuditLogRepository governanceAuditLogRepository,
            ProductSynonymRepository productSynonymRepository,
            CatalogImageService catalogImageService,
            MasterProductImageRepository masterProductImageRepository,
            com.synthora.document.DocumentRepository documentRepository,
            com.synthora.document.DocumentService documentService,
            SupplierRepository supplierRepository) {
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.productRequestRepository = productRequestRepository;
        this.userRepository = userRepository;
        this.codeGenerator = codeGenerator;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.governanceAuditLogRepository = governanceAuditLogRepository;
        this.productSynonymRepository = productSynonymRepository;
        this.catalogImageService = catalogImageService;
        this.masterProductImageRepository = masterProductImageRepository;
        this.documentRepository = documentRepository;
        this.documentService = documentService;
        this.supplierRepository = supplierRepository;
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
        long activeCount = masterProductRepository.countByStatus("ACTIVE");
        long draftCount = masterProductRepository.countByStatus("DRAFT");
        long pendingCount = productRequestRepository.countByStatus("PENDING_REVIEW");
        long approvedCount = productRequestRepository.countByStatus("APPROVED");
        long rejectedCount = productRequestRepository.countByStatus("REJECTED");
        long offeringsCount = supplierOfferingRepository.count();
        long pendingOfferingReviews = supplierOfferingRepository.countByModerationStatus("PENDING_REVIEW");
        long pendingSupplierVerifications = supplierRepository.countByVerificationStatus(com.synthora.seller.SupplierVerificationStatus.PENDING);
        long verifiedSuppliersCount = supplierRepository.countByVerified(true);
        long flaggedOfferingsCount = supplierOfferingRepository.countByModerationStatus("FLAGGED") + supplierOfferingRepository.countByModerationStatus("REJECTED");

        List<DuplicateCandidateResponse> dupes = findDuplicateCandidatesInternal();

        return new GovernanceStatsResponse(
                activeCount,
                draftCount,
                pendingCount,
                approvedCount,
                rejectedCount,
                dupes.size(),
                offeringsCount,
                pendingOfferingReviews,
                pendingSupplierVerifications,
                verifiedSuppliersCount,
                flaggedOfferingsCount
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

        auditService.record(
                authentication,
                AuditAction.MASTER_PRODUCT_CREATED,
                AuditTargetType.MASTER_PRODUCT,
                savedMp.getId().toString(),
                "Created canonical Master Product: " + savedMp.getName() + " (" + savedMp.getMasterProductCode() + ")",
                "127.0.0.1"
        );

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

        auditService.record(
                authentication,
                AuditAction.MASTER_PRODUCT_UPDATED,
                AuditTargetType.MASTER_PRODUCT,
                savedMp.getId().toString(),
                "Updated Master Product: " + savedMp.getName() + " (" + savedMp.getMasterProductCode() + "). " + (payload.updateReason() != null ? payload.updateReason() : ""),
                "127.0.0.1"
        );

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

        if (!"PENDING_REVIEW".equalsIgnoreCase(pr.getStatus()) && !"INFORMATION_REQUIRED".equalsIgnoreCase(pr.getStatus())) {
            throw new IllegalStateException("ProductRequest is already processed: " + pr.getStatus());
        }

        MasterProduct existingMp = masterProductRepository.findById(payload.existingMasterProductId())
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + payload.existingMasterProductId()));

        if (!"ACTIVE".equalsIgnoreCase(existingMp.getStatus())) {
            throw new IllegalStateException("Cannot link request to non-active MasterProduct (" + existingMp.getStatus() + ")");
        }

        pr.setStatus("APPROVED");
        pr.setReviewedBy(admin);
        pr.setReviewedAt(LocalDateTime.now());
        productRequestRepository.save(pr);

        recordGovernanceAudit(admin, GovernanceAction.PRODUCT_REQUEST_APPROVED, "PRODUCT_REQUEST", pr.getId().toString(), "PENDING_REVIEW", "APPROVED", "Linked to existing MasterProduct " + existingMp.getMasterProductCode());

        auditService.record(
                authentication,
                AuditAction.PRODUCT_REQUEST_APPROVED,
                AuditTargetType.PRODUCT_REQUEST,
                pr.getId().toString(),
                "Approved and linked chemical proposal to " + existingMp.getName() + " (" + existingMp.getMasterProductCode() + ")",
                "127.0.0.1"
        );

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

        auditService.record(
                authentication,
                AuditAction.MASTER_PRODUCT_MERGED,
                AuditTargetType.MASTER_PRODUCT,
                source.getId().toString(),
                "Merged Master Product " + source.getMasterProductCode() + " into " + target.getMasterProductCode() + ". Notes: " + (payload.adminNotes() != null ? payload.adminNotes() : ""),
                "127.0.0.1"
        );

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

        AuditAction aAction = "ACTIVE".equalsIgnoreCase(upper) ? AuditAction.MASTER_PRODUCT_ACTIVATED : AuditAction.MASTER_PRODUCT_DEACTIVATED;
        auditService.record(
                authentication,
                aAction,
                AuditTargetType.MASTER_PRODUCT,
                saved.getId().toString(),
                "Status changed from " + prevStatus + " to " + upper,
                "127.0.0.1"
        );

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

        List<GovernanceAuditLog> entityLogs = governanceAuditLogRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc("MASTER_PRODUCT", id.toString());
        List<GovernanceAuditLogResponse> logs = entityLogs.stream().map(this::toAuditResponse).toList();

        List<CatalogImageResponse> images = catalogImageService.getMasterProductImages(id);
        List<ProductSynonymResponse> synonyms = productSynonymRepository.findByMasterProductId(id)
                .stream().map(this::toSynonymResponse).toList();

        List<com.synthora.document.DocumentResponse> documents = documentRepository
                .findByOwnerTypeAndOwnerId(com.synthora.document.DocumentOwnerType.MASTER_PRODUCT, id)
                .stream()
                .map(com.synthora.document.DocumentResponse::new)
                .toList();

        java.util.Map<String, String> verifiedFields = new java.util.HashMap<>();
        verifiedFields.put("NAME", (mp.getName() != null && !mp.getName().isBlank()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("CAS_NUMBER", (mp.getCasNumber() != null && !mp.getCasNumber().isBlank()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("MOLECULAR_FORMULA", (mp.getMolecularFormula() != null && !mp.getMolecularFormula().isBlank()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("CATEGORY", (mp.getCategory() != null) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("DESCRIPTION", (mp.getDescription() != null && !mp.getDescription().isBlank()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("PRODUCT_CODE", (mp.getMasterProductCode() != null && !mp.getMasterProductCode().isBlank()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("DOCUMENTS", (!documents.isEmpty()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("CANONICAL_IMAGE", (!images.isEmpty()) ? "VERIFIED" : "ATTENTION_REQUIRED");
        verifiedFields.put("DUPLICATE_CHECK", "VERIFIED");
        verifiedFields.put("OFFERING_CONSISTENCY", "VERIFIED");

        // Apply explicit administrative overrides from latest audit records (chronological order)
        List<GovernanceAuditLog> chronologicalLogs = new java.util.ArrayList<>(entityLogs);
        java.util.Collections.reverse(chronologicalLogs);

        for (GovernanceAuditLog logEntry : chronologicalLogs) {
            if (logEntry.getPreviousState() != null && logEntry.getPreviousState().startsWith("FIELD_VERIFICATION:")) {
                String field = logEntry.getPreviousState().substring("FIELD_VERIFICATION:".length()).trim();
                verifiedFields.put(field, logEntry.getNewState());
            } else if ("FIELD_VERIFICATION".equals(logEntry.getPreviousState()) && logEntry.getReason() != null) {
                for (String knownField : List.of("NAME", "CAS_NUMBER", "MOLECULAR_FORMULA", "CATEGORY", "DESCRIPTION", "PRODUCT_CODE", "DOCUMENTS", "CANONICAL_IMAGE", "DUPLICATE_CHECK", "OFFERING_CONSISTENCY")) {
                    if (logEntry.getReason().contains("Verified field " + knownField)) {
                        verifiedFields.put(knownField, logEntry.getNewState());
                    }
                }
            }
        }

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
                images,
                documents,
                synonyms,
                verifiedFields
        );
    }

    public MasterProductResponse verifyChemicalField(UUID id, VerifyChemicalFieldPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        MasterProduct mp = masterProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + id));

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "MASTER_PRODUCT", mp.getId().toString(),
                "FIELD_VERIFICATION:" + payload.fieldName(), payload.status(), "Verified field " + payload.fieldName() + ". Notes: " + payload.notes());

        return toMasterProductResponse(mp);
    }

    public Page<SupplierOfferingResponse> searchSupplierOfferings(String query, String moderationStatus, Boolean flagged, Long supplierId, Pageable pageable, Authentication authentication) {
        resolveAdmin(authentication);
        org.springframework.data.jpa.domain.Specification<SupplierOffering> spec = (root, q, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (moderationStatus != null && !moderationStatus.isBlank() && !"ALL".equalsIgnoreCase(moderationStatus)) {
                predicates.add(cb.equal(cb.upper(root.get("moderationStatus")), moderationStatus.trim().toUpperCase()));
            }

            if (Boolean.TRUE.equals(flagged)) {
                predicates.add(cb.or(
                        cb.equal(cb.upper(root.get("moderationStatus")), "FLAGGED"),
                        cb.equal(cb.upper(root.get("availabilityStatus")), "FLAGGED")
                ));
            }

            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }

            if (query != null && !query.isBlank()) {
                String lq = "%" + query.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Join<SupplierOffering, MasterProduct> mpJoin = root.join("masterProduct", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Join<SupplierOffering, Supplier> supJoin = root.join("supplier", jakarta.persistence.criteria.JoinType.LEFT);

                predicates.add(cb.or(
                        cb.like(cb.lower(mpJoin.get("name")), lq),
                        cb.like(cb.lower(mpJoin.get("masterProductCode")), lq),
                        cb.like(cb.lower(mpJoin.get("casNumber")), lq),
                        cb.like(cb.lower(supJoin.get("name")), lq)
                ));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return supplierOfferingRepository.findAll(spec, pageable).map(this::toSupplierOfferingResponse);
    }

    public Page<SupplierOfferingResponse> searchSupplierOfferings(String query, Boolean flagged, Pageable pageable, Authentication authentication) {
        return searchSupplierOfferings(query, null, flagged, null, pageable, authentication);
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
                o.getSupplier() != null ? o.getSupplier().getLogoUrl() : null,
                o.getSupplier() != null ? Boolean.TRUE.equals(o.getSupplier().getVerified()) : false,
                null,
                null,
                null,
                o.getCreatedByRole(),
                o.getCreatedByAdminId(),
                o.getCreatedByAdminName(),
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

    public ProductSynonymResponse addOfficialSynonym(UUID masterProductId, AddSynonymPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        MasterProduct mp = masterProductRepository.findById(masterProductId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + masterProductId));

        String rawSynonym = payload.synonym() != null ? payload.synonym().trim() : "";
        if (rawSynonym.isBlank()) {
            throw new IllegalArgumentException("Synonym cannot be blank");
        }

        Optional<ProductSynonym> existingOpt = productSynonymRepository.findByMasterProductIdAndSynonymNormalized(masterProductId, rawSynonym);
        if (existingOpt.isPresent()) {
            ProductSynonym existing = existingOpt.get();
            if (existing.getStatus() == SynonymStatus.APPROVED && existing.getSource() == SynonymSource.OFFICIAL) {
                throw new IllegalStateException("Synonym already exists for this Master Product: " + rawSynonym);
            }
            existing.setStatus(SynonymStatus.APPROVED);
            existing.setSource(SynonymSource.OFFICIAL);
            ProductSynonym saved = productSynonymRepository.save(existing);
            recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "PRODUCT_SYNONYM", saved.getId().toString(),
                    "PENDING", "APPROVED", "Approved official synonym: " + saved.getSynonym());
            return toSynonymResponse(saved);
        }

        ProductSynonym synonym = new ProductSynonym();
        synonym.setMasterProduct(mp);
        synonym.setSynonym(rawSynonym);
        synonym.setSource(SynonymSource.OFFICIAL);
        synonym.setStatus(SynonymStatus.APPROVED);
        synonym.setCreatedBy(admin);

        ProductSynonym saved = productSynonymRepository.save(synonym);
        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "PRODUCT_SYNONYM", saved.getId().toString(),
                null, "APPROVED", "Added official synonym: " + saved.getSynonym());

        return toSynonymResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductSynonymResponse> getSynonymsForMasterProduct(UUID masterProductId, Authentication authentication) {
        resolveAdmin(authentication);
        if (!masterProductRepository.existsById(masterProductId)) {
            throw new ResourceNotFoundException("MasterProduct not found: " + masterProductId);
        }
        return productSynonymRepository.findByMasterProductId(masterProductId)
                .stream().map(this::toSynonymResponse).toList();
    }

    public void deleteSynonym(UUID masterProductId, UUID synonymId, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        ProductSynonym synonym = productSynonymRepository.findById(synonymId)
                .orElseThrow(() -> new ResourceNotFoundException("Synonym not found: " + synonymId));

        if (!synonym.getMasterProduct().getId().equals(masterProductId)) {
            throw new IllegalArgumentException("Synonym does not belong to specified Master Product");
        }

        productSynonymRepository.delete(synonym);
        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "PRODUCT_SYNONYM", synonymId.toString(),
                synonym.getStatus().name(), "DELETED", "Removed synonym: " + synonym.getSynonym());
    }

    public ProductSynonymResponse reviewSupplierSynonym(UUID synonymId, ReviewSynonymPayload payload, Authentication authentication) {
        User admin = resolveAdmin(authentication);
        ProductSynonym synonym = productSynonymRepository.findById(synonymId)
                .orElseThrow(() -> new ResourceNotFoundException("Synonym not found: " + synonymId));

        String oldStatus = synonym.getStatus().name();
        synonym.setStatus(payload.status());
        ProductSynonym saved = productSynonymRepository.save(synonym);

        recordGovernanceAudit(admin, GovernanceAction.MASTER_PRODUCT_UPDATED, "PRODUCT_SYNONYM", synonym.getId().toString(),
                oldStatus, payload.status().name(), "Reviewed synonym suggestion: " + synonym.getSynonym());

        return toSynonymResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductSynonymResponse> getPendingSynonyms(Authentication authentication) {
        resolveAdmin(authentication);
        return productSynonymRepository.findByStatusOrderByCreatedAtDesc(SynonymStatus.PENDING)
                .stream().map(this::toSynonymResponse).toList();
    }

    public ProductSynonymResponse toSynonymResponse(ProductSynonym s) {
        return new ProductSynonymResponse(
                s.getId(),
                s.getMasterProduct() != null ? s.getMasterProduct().getId() : null,
                s.getSynonym(),
                s.getSource(),
                s.getStatus(),
                s.getCreatedBy() != null ? s.getCreatedBy().getId() : null,
                s.getCreatedBy() != null ? s.getCreatedBy().getName() : null,
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
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
        String primaryImageUrl = masterProductImageRepository
                .findByMasterProductIdAndIsPrimaryTrueAndStatus(mp.getId(), "ACTIVE")
                .map(img -> "/api/v1/master-products/" + mp.getId() + "/images/" + img.getId() + "/content")
                .orElseGet(() -> masterProductImageRepository
                        .findByMasterProductIdAndStatusOrderByDisplayOrderAsc(mp.getId(), "ACTIVE")
                        .stream().findFirst()
                        .map(img -> "/api/v1/master-products/" + mp.getId() + "/images/" + img.getId() + "/content")
                        .orElse(null)
                );

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
                primaryImageUrl,
                mp.getCreatedAt(),
                mp.getUpdatedAt()
        );
    }
}
