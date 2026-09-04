package com.kemkendra.seller.verification;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.document.Document;
import com.kemkendra.document.DocumentRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.notification.NotificationService;
import com.kemkendra.notification.NotificationType;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierOfferingRepository;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.SupplierVerificationAudit;
import com.kemkendra.seller.SupplierVerificationAuditRepository;
import com.kemkendra.seller.SupplierVerificationStatus;
import com.kemkendra.seller.verification.dto.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierVerificationService {

    private final SupplierRepository supplierRepository;
    private final SupplierVerificationEvidenceRepository evidenceRepository;
    private final SupplierVerificationAuditRepository auditRepository;
    private final SupplierVerificationRequirementResolver requirementResolver;
    private final SupplierCompletenessCalculator completenessCalculator;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final NotificationService notificationService;
    private final com.kemkendra.admin.audit.AuditService auditService;

    public SupplierVerificationService(
            SupplierRepository supplierRepository,
            SupplierVerificationEvidenceRepository evidenceRepository,
            SupplierVerificationAuditRepository auditRepository,
            SupplierVerificationRequirementResolver requirementResolver,
            SupplierCompletenessCalculator completenessCalculator,
            UserRepository userRepository,
            DocumentRepository documentRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            NotificationService notificationService,
            com.kemkendra.admin.audit.AuditService auditService) {
        this.supplierRepository = supplierRepository;
        this.evidenceRepository = evidenceRepository;
        this.auditRepository = auditRepository;
        this.requirementResolver = requirementResolver;
        this.completenessCalculator = completenessCalculator;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    public SupplierVerificationWorkspaceDto getVerificationDetails(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        SupplierCompletenessDto completeness = completenessCalculator.calculateCompleteness(supplier);
        Set<VerificationType> mandatoryTypes = requirementResolver.getMandatoryRequirements(supplier.getBusinessType());

        List<SupplierVerificationEvidence> existingEvidences = evidenceRepository.findBySupplierId(supplierId);
        Map<VerificationType, SupplierVerificationEvidence> evidenceMap = existingEvidences.stream()
                .collect(Collectors.toMap(SupplierVerificationEvidence::getVerificationType, e -> e, (a, b) -> a));

        List<VerificationChecklistItemDto> checklist = new ArrayList<>();
        for (VerificationType type : VerificationType.values()) {
            boolean mandatory = mandatoryTypes.contains(type);
            SupplierVerificationEvidence evidence = evidenceMap.get(type);

            EvidenceStatus status = (evidence != null ? evidence.getStatus() : EvidenceStatus.UNVERIFIED);
            UUID docId = (evidence != null ? evidence.getEvidenceDocumentId() : null);
            String adminNotes = (evidence != null ? evidence.getAdminNotes() : null);
            String rejectionReason = (evidence != null ? evidence.getRejectionReason() : null);

            // Check document expiry if document is attached
            if (docId != null) {
                Document doc = documentRepository.findById(docId).orElse(null);
                if (doc != null && doc.getExpiryDate() != null && LocalDate.now().isAfter(doc.getExpiryDate())) {
                    status = EvidenceStatus.EXPIRED;
                }
            }

            checklist.add(new VerificationChecklistItemDto(
                    type.name(),
                    type,
                    status,
                    mandatory,
                    docId,
                    adminNotes,
                    rejectionReason
            ));
        }

        List<SupplierVerificationAudit> audits = auditRepository.findBySupplierIdOrderByTimestampDesc(supplierId);
        List<VerificationAuditDto> auditDtos = audits.stream()
                .map(a -> new VerificationAuditDto(a.getId(), a.getAdminName(), a.getPreviousStatus().name(), a.getNewStatus().name(), a.getNotes(), a.getTimestamp()))
                .toList();

        long offeringCount = supplierOfferingRepository.countBySupplierId(supplierId);

        return new SupplierVerificationWorkspaceDto(
                supplier.getId(),
                supplier.getDisplayName(),
                supplier.getLegalName() != null && !supplier.getLegalName().isBlank() ? supplier.getLegalName() : supplier.getDisplayName(),
                supplier.getTradeName(),
                supplier.getBusinessType(),
                supplier.getLogoUrl(),
                supplier.getCountryCode(),
                supplier.getCountryName(),
                supplier.getStateProvince(),
                supplier.getCity(),
                supplier.getPostalCode(),
                supplier.getRegisteredAddress(),
                (supplier.getUser() != null && supplier.getUser().getEmail() != null) ? supplier.getUser().getEmail() : supplier.getBusinessEmail(),
                supplier.getBusinessPhone(),
                supplier.getAuthorizedRepresentativeName(),
                supplier.getAuthorizedRepresentativeDesignation(),
                supplier.getUser() != null ? supplier.getUser().isEmailVerified() : Boolean.TRUE.equals(supplier.getEmailVerified()),
                Boolean.TRUE.equals(supplier.getPhoneVerified()),
                supplier.getWebsite(),
                supplier.getTaxVatNumber(),
                supplier.getCompanyRegistrationNumber(),
                supplier.getBusinessDescription(),
                supplier.getCountriesServed(),
                supplier.getPrimaryCategories(),
                supplier.getYearsInBusiness(),
                Boolean.TRUE.equals(supplier.getExportReady()),
                Boolean.TRUE.equals(supplier.getVerified()),
                supplier.getVerificationStatus() != null ? supplier.getVerificationStatus().name() : "PENDING",
                completeness.overallPercentage(),
                completeness,
                checklist,
                auditDtos,
                offeringCount,
                supplier.getAdminRequestInfoNotes(),
                supplier.getSupplierResponseNotes(),
                supplier.getVerificationNotes()
        );
    }

    public SupplierVerificationWorkspaceDto startReview(Long supplierId, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        if (supplier.getVerificationStatus() == SupplierVerificationStatus.VERIFIED && Boolean.TRUE.equals(supplier.getVerified())) {
            throw new IllegalStateException("Cannot restart review on an already verified supplier: " + supplierId);
        }

        if (supplier.getVerificationStatus() == SupplierVerificationStatus.UNDER_REVIEW) {
            return getVerificationDetails(supplierId);
        }

        User admin = getAuthenticatedUser(authentication);
        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus();
        supplier.setVerificationStatus(SupplierVerificationStatus.UNDER_REVIEW);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        recordAudit(supplier, admin, oldStatus, SupplierVerificationStatus.UNDER_REVIEW, "Started verification review.");
        return getVerificationDetails(supplierId);
    }

    public SupplierVerificationWorkspaceDto verifyItem(Long supplierId, VerificationType type, UUID documentId, String notes, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));
        User admin = getAuthenticatedUser(authentication);

        SupplierVerificationEvidence evidence = evidenceRepository.findBySupplierIdAndVerificationType(supplierId, type)
                .orElse(new SupplierVerificationEvidence(supplierId, type, EvidenceStatus.UNVERIFIED));

        evidence.setStatus(EvidenceStatus.VERIFIED);
        if (documentId != null) evidence.setEvidenceDocumentId(documentId);
        evidence.setVerifiedBy(admin.getId());
        evidence.setVerifiedAt(LocalDateTime.now());
        evidence.setAdminNotes(notes);
        evidence.setRejectionReason(null);
        evidenceRepository.save(evidence);

        try {
            auditService.recordInternal(
                    admin.getId(),
                    com.kemkendra.admin.audit.AuditAction.SUPPLIER_EVIDENCE_UPDATED,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER,
                    supplierId.toString(),
                    "Verified compliance item " + type.name() + (notes != null ? ": " + notes : ""),
                    "127.0.0.1"
            );
        } catch (Exception ignored) {}

        return getVerificationDetails(supplierId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplierVerificationWorkspaceDto flagItem(Long supplierId, VerificationType type, String notes, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));
        User admin = getAuthenticatedUser(authentication);

        SupplierVerificationEvidence evidence = evidenceRepository.findBySupplierIdAndVerificationType(supplierId, type)
                .orElse(new SupplierVerificationEvidence(supplierId, type, EvidenceStatus.UNVERIFIED));

        evidence.setStatus(EvidenceStatus.FLAGGED);
        evidence.setAdminNotes(notes);
        evidenceRepository.save(evidence);

        try {
            auditService.recordInternal(
                    admin.getId(),
                    com.kemkendra.admin.audit.AuditAction.SUPPLIER_EVIDENCE_UPDATED,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER,
                    supplierId.toString(),
                    "Flagged compliance item " + type.name() + (notes != null ? ": " + notes : ""),
                    "127.0.0.1"
            );
        } catch (Exception ignored) {}

        return getVerificationDetails(supplierId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplierVerificationWorkspaceDto rejectItem(Long supplierId, VerificationType type, String reason, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));
        User admin = getAuthenticatedUser(authentication);

        SupplierVerificationEvidence evidence = evidenceRepository.findBySupplierIdAndVerificationType(supplierId, type)
                .orElse(new SupplierVerificationEvidence(supplierId, type, EvidenceStatus.UNVERIFIED));

        evidence.setStatus(EvidenceStatus.REJECTED);
        evidence.setRejectionReason(reason);
        evidenceRepository.save(evidence);

        try {
            auditService.recordInternal(
                    admin.getId(),
                    com.kemkendra.admin.audit.AuditAction.SUPPLIER_EVIDENCE_UPDATED,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER,
                    supplierId.toString(),
                    "Rejected compliance item " + type.name() + (reason != null ? ": " + reason : ""),
                    "127.0.0.1"
            );
        } catch (Exception ignored) {}

        return getVerificationDetails(supplierId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplierVerificationWorkspaceDto requestInformation(Long supplierId, String requestNotes, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        User admin = getAuthenticatedUser(authentication);
        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus();
        supplier.setVerificationStatus(SupplierVerificationStatus.INFORMATION_REQUIRED);
        supplier.setAdminRequestInfoNotes(requestNotes);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        recordAudit(supplier, admin, oldStatus, SupplierVerificationStatus.INFORMATION_REQUIRED, "Requested information: " + requestNotes);

        if (supplier.getUser() != null) {
            notificationService.createNotification(
                    supplier.getUser().getId(),
                    NotificationType.VERIFICATION_INFO_REQUESTED,
                    "Verification Information Requested",
                    "Admin requested additional information: " + requestNotes,
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
            );
        }

        return getVerificationDetails(supplierId);
    }

    public SupplierVerificationWorkspaceDto submitSupplierResponse(Authentication authentication, String responseNotes) {
        User supplierUser = getAuthenticatedUser(authentication);
        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found for user"));

        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus();
        supplier.setVerificationStatus(SupplierVerificationStatus.UNDER_REVIEW);
        supplier.setSupplierResponseNotes(responseNotes);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        // Notify admins
        List<User> admins = userRepository.findByRole(com.kemkendra.identity.UserRole.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    NotificationType.SUPPLIER_VERIFICATION_SUBMITTED,
                    "Supplier Verification Update",
                    supplier.getName() + " submitted requested verification information.",
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
            );
        }

        return getVerificationDetails(supplier.getId());
    }

    public SupplierVerificationWorkspaceDto submitInitialVerification(Authentication authentication) {
        User supplierUser = getAuthenticatedUser(authentication);
        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found for user"));

        if (supplier.getVerificationStatus() == SupplierVerificationStatus.VERIFIED && Boolean.TRUE.equals(supplier.getVerified())) {
            throw new IllegalStateException("Supplier is already verified: " + supplier.getId());
        }

        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus() != null
                ? supplier.getVerificationStatus()
                : SupplierVerificationStatus.DRAFT;

        supplier.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        recordAudit(supplier, supplierUser, oldStatus, SupplierVerificationStatus.PENDING, "Supplier submitted initial company verification application.");

        try {
            notificationService.createNotification(
                    supplierUser.getId(),
                    NotificationType.SUPPLIER_VERIFICATION_SUBMITTED,
                    "Verification Application Submitted",
                    "Your company verification application has been submitted for review.",
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
            );

            List<User> admins = userRepository.findByRole(com.kemkendra.identity.UserRole.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.SUPPLIER_VERIFICATION_SUBMITTED,
                        "New Supplier Verification Pending",
                        "Supplier " + supplier.getName() + " has submitted company profile for verification.",
                        NotificationEntityType.SUPPLIER,
                        UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
                );
            }
        } catch (Exception e) {
            // Notification / email failures must not roll back the verification transaction
        }

        return getVerificationDetails(supplier.getId());
    }

    public SupplierVerificationWorkspaceDto attachEvidenceDocument(Authentication authentication, VerificationType type, UUID documentId) {
        User supplierUser = getAuthenticatedUser(authentication);
        Supplier supplier = supplierRepository.findByUser(supplierUser)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found for user"));

        SupplierVerificationEvidence evidence = evidenceRepository.findBySupplierIdAndVerificationType(supplier.getId(), type)
                .orElse(new SupplierVerificationEvidence(supplier.getId(), type, EvidenceStatus.UNVERIFIED));

        evidence.setEvidenceDocumentId(documentId);
        if (evidence.getStatus() == EvidenceStatus.REJECTED || evidence.getStatus() == EvidenceStatus.FLAGGED || evidence.getStatus() == EvidenceStatus.MISSING) {
            evidence.setStatus(EvidenceStatus.UNVERIFIED);
        }
        evidenceRepository.save(evidence);

        return getVerificationDetails(supplier.getId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplierVerificationWorkspaceDto finalizeVerification(Long supplierId, String overrideReason, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        if (supplier.getVerificationStatus() == SupplierVerificationStatus.VERIFIED && Boolean.TRUE.equals(supplier.getVerified())) {
            throw new IllegalStateException("Supplier is already verified: " + supplierId);
        }

        User admin = getAuthenticatedUser(authentication);
        Set<VerificationType> mandatoryTypes = requirementResolver.getMandatoryRequirements(supplier.getBusinessType());

        List<SupplierVerificationEvidence> evidences = evidenceRepository.findBySupplierId(supplierId);
        Map<VerificationType, EvidenceStatus> statusMap = new HashMap<>();
        for (SupplierVerificationEvidence e : evidences) {
            EvidenceStatus status = e.getStatus();
            if (e.getEvidenceDocumentId() != null) {
                Document doc = documentRepository.findById(e.getEvidenceDocumentId()).orElse(null);
                if (doc != null && doc.getExpiryDate() != null && LocalDate.now().isAfter(doc.getExpiryDate())) {
                    status = EvidenceStatus.EXPIRED;
                }
            }
            statusMap.put(e.getVerificationType(), status);
        }

        List<String> incompleteMandatory = new ArrayList<>();
        for (VerificationType req : mandatoryTypes) {
            EvidenceStatus st = statusMap.getOrDefault(req, EvidenceStatus.UNVERIFIED);
            if (st != EvidenceStatus.VERIFIED) {
                incompleteMandatory.add(req.name() + " (" + st + ")");
            }
        }

        if (!incompleteMandatory.isEmpty() && (overrideReason == null || overrideReason.isBlank())) {
            throw new IllegalStateException("Cannot verify supplier. Mandatory verification items incomplete: " + String.join(", ", incompleteMandatory));
        }

        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus();
        supplier.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplier.setVerified(true);
        supplier.setVerificationNotes(overrideReason != null ? "Admin Override: " + overrideReason : "Verified clean.");
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        recordAudit(supplier, admin, oldStatus, SupplierVerificationStatus.VERIFIED, overrideReason != null ? "Verified via Admin Override: " + overrideReason : "Final verification approved.");

        if (supplier.getUser() != null) {
            notificationService.createNotification(
                    supplier.getUser().getId(),
                    NotificationType.SUPPLIER_VERIFIED,
                    "Supplier Verification Approved",
                    "Your enterprise supplier account is officially VERIFIED.",
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
            );
        }

        return getVerificationDetails(supplierId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplierVerificationWorkspaceDto rejectSupplier(Long supplierId, String reason, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        User admin = getAuthenticatedUser(authentication);
        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus();
        supplier.setVerificationStatus(SupplierVerificationStatus.REJECTED);
        supplier.setVerified(false);
        supplier.setVerificationNotes(reason);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        recordAudit(supplier, admin, oldStatus, SupplierVerificationStatus.REJECTED, reason);

        if (supplier.getUser() != null) {
            notificationService.createNotification(
                    supplier.getUser().getId(),
                    NotificationType.SUPPLIER_REJECTED,
                    "Supplier Verification Rejected",
                    "Your verification was rejected: " + reason,
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
            );
        }

        return getVerificationDetails(supplierId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplierVerificationWorkspaceDto suspendSupplier(Long supplierId, String reason, Authentication authentication) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        User admin = getAuthenticatedUser(authentication);
        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus();
        supplier.setVerificationStatus(SupplierVerificationStatus.SUSPENDED);
        supplier.setVerified(false);
        supplier.setVerificationNotes(reason);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        recordAudit(supplier, admin, oldStatus, SupplierVerificationStatus.SUSPENDED, reason);

        if (supplier.getUser() != null) {
            notificationService.createNotification(
                    supplier.getUser().getId(),
                    NotificationType.SUPPLIER_SUSPENDED,
                    "Supplier Account Suspended",
                    "Your supplier account has been suspended: " + reason,
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + supplier.getId()).getBytes())
            );
        }

        return getVerificationDetails(supplierId);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void recordAudit(Supplier supplier, User admin, SupplierVerificationStatus oldStatus, SupplierVerificationStatus newStatus, String notes) {
        SupplierVerificationAudit audit = new SupplierVerificationAudit();
        audit.setSupplierId(supplier.getId());
        audit.setAdminId(admin.getId());
        audit.setAdminName(admin.getName() != null ? admin.getName() : admin.getEmail());
        audit.setPreviousStatus(oldStatus);
        audit.setNewStatus(newStatus);
        audit.setNotes(notes);
        audit.setTimestamp(LocalDateTime.now());
        auditRepository.save(audit);

        com.kemkendra.admin.audit.AuditAction auditAction = switch (newStatus) {
            case PENDING -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_VERIFICATION_SUBMITTED;
            case UNDER_REVIEW -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_REVIEW_STARTED;
            case INFORMATION_REQUIRED -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_INFORMATION_REQUESTED;
            case VERIFIED -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_VERIFIED;
            case REJECTED -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_REJECTED;
            case SUSPENDED -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_SUSPENDED;
            default -> com.kemkendra.admin.audit.AuditAction.SUPPLIER_UNVERIFIED;
        };

        try {
            auditService.recordInternal(
                    admin.getId(),
                    auditAction,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER,
                    supplier.getId().toString(),
                    notes != null ? notes : ("Supplier verification status transitioned to " + newStatus.name()),
                    "127.0.0.1"
            );
        } catch (Exception ignored) {}
    }
}
