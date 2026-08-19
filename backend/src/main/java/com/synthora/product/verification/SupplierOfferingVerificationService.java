package com.synthora.product.verification;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.document.Document;
import com.synthora.document.DocumentRepository;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationService;
import com.synthora.notification.NotificationType;
import com.synthora.product.MasterProduct;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierOffering;
import com.synthora.product.SupplierOfferingRepository;
import com.synthora.product.verification.dto.*;
import com.synthora.seller.SupplierVerificationStatus;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierOfferingVerificationService {

    private final SupplierOfferingRepository supplierOfferingRepository;
    private final SupplierOfferingVerificationEvidenceRepository evidenceRepository;
    private final SupplierOfferingAuditRepository auditRepository;
    private final SupplierOfferingRequirementResolver requirementResolver;
    private final SupplierOfferingCompletenessCalculator completenessCalculator;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;

    public SupplierOfferingVerificationService(
            SupplierOfferingRepository supplierOfferingRepository,
            SupplierOfferingVerificationEvidenceRepository evidenceRepository,
            SupplierOfferingAuditRepository auditRepository,
            SupplierOfferingRequirementResolver requirementResolver,
            SupplierOfferingCompletenessCalculator completenessCalculator,
            UserRepository userRepository,
            DocumentRepository documentRepository,
            NotificationService notificationService) {
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.evidenceRepository = evidenceRepository;
        this.auditRepository = auditRepository;
        this.requirementResolver = requirementResolver;
        this.completenessCalculator = completenessCalculator;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.notificationService = notificationService;
    }

    public SupplierOfferingGovernanceWorkspaceDto getOfferingVerificationDetails(UUID offeringId) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        MasterProduct mp = offering.getMasterProduct();
        Supplier supplier = offering.getSupplier();

        SupplierOfferingCompletenessDto completeness = completenessCalculator.calculateCompleteness(offering);
        Set<OfferingVerificationType> mandatoryTypes = requirementResolver.getMandatoryRequirements();

        List<SupplierOfferingVerificationEvidence> existingEvidences = evidenceRepository.findByOfferingId(offeringId);
        Map<OfferingVerificationType, SupplierOfferingVerificationEvidence> evidenceMap = existingEvidences.stream()
                .collect(Collectors.toMap(SupplierOfferingVerificationEvidence::getVerificationType, e -> e, (a, b) -> a));

        List<OfferingVerificationItemDto> checklist = new ArrayList<>();
        for (OfferingVerificationType type : OfferingVerificationType.values()) {
            boolean mandatory = mandatoryTypes.contains(type);
            SupplierOfferingVerificationEvidence evidence = evidenceMap.get(type);

            OfferingEvidenceStatus status = (evidence != null ? evidence.getStatus() : OfferingEvidenceStatus.UNVERIFIED);
            UUID docId = (evidence != null ? evidence.getEvidenceDocumentId() : null);
            String adminNotes = (evidence != null ? evidence.getAdminNotes() : null);
            String rejectionReason = (evidence != null ? evidence.getRejectionReason() : null);

            checklist.add(new OfferingVerificationItemDto(
                    type.name(),
                    type,
                    status,
                    mandatory,
                    docId,
                    adminNotes,
                    rejectionReason
            ));
        }

        List<SupplierOfferingAudit> audits = auditRepository.findByOfferingIdOrderByTimestampDesc(offeringId);
        List<OfferingAuditDto> auditDtos = audits.stream()
                .map(a -> new OfferingAuditDto(
                        a.getId(),
                        a.getAdminName(),
                        a.getAction(),
                        a.getPreviousStatus(),
                        a.getNewStatus(),
                        a.getFieldName(),
                        a.getPreviousValue(),
                        a.getNewValue(),
                        a.getReason(),
                        a.getTimestamp()
                ))
                .toList();

        return new SupplierOfferingGovernanceWorkspaceDto(
                offering.getId(),
                mp.getId(),
                mp.getName(),
                mp.getMasterProductCode(),
                mp.getCasNumber(),
                mp.getMolecularFormula(),
                mp.getCategory().name(),
                mp.getStatus(),
                supplier.getId(),
                supplier.getName(),
                supplier.getLegalName() != null ? supplier.getLegalName() : supplier.getName(),
                supplier.getVerificationStatus().name(),
                supplier.getBusinessType(),
                offering.getPrice(),
                offering.getCurrency(),
                offering.getPurity(),
                offering.getGrade(),
                offering.getMoqKg(),
                offering.getPackaging(),
                offering.getStock(),
                offering.getLeadTimeDays(),
                offering.getCoaAvailable(),
                offering.getMsdsAvailable(),
                offering.getExportReady(),
                offering.getAvailabilityStatus(),
                offering.getModerationStatus(),
                offering.getOfferingVerificationStatus(),
                completeness.overallPercentage(),
                completeness,
                checklist,
                auditDtos,
                offering.getAdminRequestInfoNotes(),
                offering.getSupplierResponseNotes(),
                offering.getModerationNotes()
        );
    }

    public SupplierOfferingGovernanceWorkspaceDto startOfferingReview(UUID offeringId, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("UNDER_REVIEW");
        offering.setOfferingVerificationStatus("UNDER_REVIEW");
        supplierOfferingRepository.save(offering);

        recordAudit(offering, admin, "START_REVIEW", oldStatus, "UNDER_REVIEW", null, null, null, "Started offering due diligence review.");
        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto verifyOfferingItem(UUID offeringId, OfferingVerificationType type, UUID documentId, String notes, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        SupplierOfferingVerificationEvidence evidence = evidenceRepository.findByOfferingIdAndVerificationType(offeringId, type)
                .orElse(new SupplierOfferingVerificationEvidence(offeringId, type, OfferingEvidenceStatus.UNVERIFIED));

        evidence.setStatus(OfferingEvidenceStatus.VERIFIED);
        if (documentId != null) evidence.setEvidenceDocumentId(documentId);
        evidence.setVerifiedBy(admin.getId());
        evidence.setVerifiedAt(LocalDateTime.now());
        evidence.setAdminNotes(notes);
        evidence.setRejectionReason(null);
        evidenceRepository.save(evidence);

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto flagOfferingItem(UUID offeringId, OfferingVerificationType type, String notes, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        SupplierOfferingVerificationEvidence evidence = evidenceRepository.findByOfferingIdAndVerificationType(offeringId, type)
                .orElse(new SupplierOfferingVerificationEvidence(offeringId, type, OfferingEvidenceStatus.UNVERIFIED));

        evidence.setStatus(OfferingEvidenceStatus.FLAGGED);
        evidence.setAdminNotes(notes);
        evidenceRepository.save(evidence);

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto rejectOfferingItem(UUID offeringId, OfferingVerificationType type, String reason, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        SupplierOfferingVerificationEvidence evidence = evidenceRepository.findByOfferingIdAndVerificationType(offeringId, type)
                .orElse(new SupplierOfferingVerificationEvidence(offeringId, type, OfferingEvidenceStatus.UNVERIFIED));

        evidence.setStatus(OfferingEvidenceStatus.REJECTED);
        evidence.setRejectionReason(reason);
        evidenceRepository.save(evidence);

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto requestOfferingInformation(UUID offeringId, String requestNotes, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("INFORMATION_REQUIRED");
        offering.setOfferingVerificationStatus("INFORMATION_REQUIRED");
        offering.setAdminRequestInfoNotes(requestNotes);
        supplierOfferingRepository.save(offering);

        recordAudit(offering, admin, "REQUEST_INFO", oldStatus, "INFORMATION_REQUIRED", null, null, null, requestNotes);

        if (offering.getSupplier() != null && offering.getSupplier().getUser() != null) {
            notificationService.createNotification(
                    offering.getSupplier().getUser().getId(),
                    NotificationType.SUPPLIER_OFFERING_MODERATED,
                    "Offering Information Requested",
                    "Admin requested additional information for offering: " + requestNotes,
                    NotificationEntityType.SUPPLIER_OFFERING,
                    offering.getId()
            );
        }

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto submitSupplierOfferingResponse(UUID offeringId, Authentication authentication, String responseNotes) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("UNDER_REVIEW");
        offering.setOfferingVerificationStatus("UNDER_REVIEW");
        offering.setSupplierResponseNotes(responseNotes);
        supplierOfferingRepository.save(offering);

        List<User> admins = userRepository.findByRole(com.synthora.identity.UserRole.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    NotificationType.SUPPLIER_OFFERING_UPDATED,
                    "Offering Response Submitted",
                    "Supplier submitted requested information for offering: " + offering.getMasterProduct().getName(),
                    NotificationEntityType.SUPPLIER_OFFERING,
                    offering.getId()
            );
        }

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto approveOffering(UUID offeringId, String overrideReason, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        MasterProduct mp = offering.getMasterProduct();
        Supplier supplier = offering.getSupplier();

        // Admin Approval Guard Rules:
        if (!"ACTIVE".equalsIgnoreCase(mp.getStatus())) {
            throw new IllegalStateException("Cannot approve offering. MasterProduct is not ACTIVE (Status: " + mp.getStatus() + ")");
        }

        if (supplier.getVerificationStatus() != SupplierVerificationStatus.VERIFIED || !Boolean.TRUE.equals(supplier.getVerified())) {
            throw new IllegalStateException("Cannot approve offering. Supplier is not VERIFIED (Supplier Status: " + supplier.getVerificationStatus() + ")");
        }

        if (offering.getPrice() == null || offering.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Cannot approve offering. Invalid or missing price.");
        }

        if (offering.getPurity() == null || offering.getGrade() == null || offering.getMoqKg() == null) {
            throw new IllegalStateException("Cannot approve offering. Mandatory commercial fields (Purity, Grade, MOQ) missing.");
        }

        Set<OfferingVerificationType> mandatoryTypes = requirementResolver.getMandatoryRequirements();
        List<SupplierOfferingVerificationEvidence> evidences = evidenceRepository.findByOfferingId(offeringId);
        Map<OfferingVerificationType, OfferingEvidenceStatus> statusMap = evidences.stream()
                .collect(Collectors.toMap(SupplierOfferingVerificationEvidence::getVerificationType, SupplierOfferingVerificationEvidence::getStatus, (a, b) -> a));

        List<String> incompleteMandatory = new ArrayList<>();
        for (OfferingVerificationType req : mandatoryTypes) {
            OfferingEvidenceStatus st = statusMap.getOrDefault(req, OfferingEvidenceStatus.UNVERIFIED);
            if (st != OfferingEvidenceStatus.VERIFIED) {
                incompleteMandatory.add(req.name() + " (" + st + ")");
            }
        }

        for (Map.Entry<OfferingVerificationType, OfferingEvidenceStatus> entry : statusMap.entrySet()) {
            if (entry.getValue() == OfferingEvidenceStatus.REJECTED || entry.getValue() == OfferingEvidenceStatus.FLAGGED) {
                String itemStr = entry.getKey().name() + " (" + entry.getValue() + ")";
                if (!incompleteMandatory.contains(itemStr)) {
                    incompleteMandatory.add(itemStr);
                }
            }
        }

        if (!incompleteMandatory.isEmpty() && (overrideReason == null || overrideReason.isBlank())) {
            throw new IllegalStateException("Cannot approve offering. Mandatory verification items incomplete: " + String.join(", ", incompleteMandatory));
        }

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("APPROVED");
        offering.setOfferingVerificationStatus("APPROVED");
        offering.setModerationNotes(overrideReason != null ? "Admin Override: " + overrideReason : "Approved clean.");
        offering.setVerifiedAt(LocalDateTime.now());
        offering.setVerifiedBy(admin.getId());
        supplierOfferingRepository.save(offering);

        recordAudit(offering, admin, "APPROVE", oldStatus, "APPROVED", null, null, null, overrideReason != null ? "Approved via Admin Override: " + overrideReason : "Approved clean.");

        if (supplier.getUser() != null) {
            notificationService.createNotification(
                    supplier.getUser().getId(),
                    NotificationType.SUPPLIER_OFFERING_MODERATED,
                    "Offering Approved",
                    "Your commercial offering for " + mp.getName() + " is now APPROVED and live on the public marketplace.",
                    NotificationEntityType.SUPPLIER_OFFERING,
                    offering.getId()
            );
        }

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto rejectOffering(UUID offeringId, String reason, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("REJECTED");
        offering.setOfferingVerificationStatus("REJECTED");
        offering.setModerationNotes(reason);
        supplierOfferingRepository.save(offering);

        recordAudit(offering, admin, "REJECT", oldStatus, "REJECTED", null, null, null, reason);

        if (offering.getSupplier() != null && offering.getSupplier().getUser() != null) {
            notificationService.createNotification(
                    offering.getSupplier().getUser().getId(),
                    NotificationType.SUPPLIER_OFFERING_MODERATED,
                    "Offering Rejected",
                    "Your offering for " + offering.getMasterProduct().getName() + " was rejected: " + reason,
                    NotificationEntityType.SUPPLIER_OFFERING,
                    offering.getId()
            );
        }

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto suspendOffering(UUID offeringId, String reason, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("SUSPENDED");
        offering.setOfferingVerificationStatus("SUSPENDED");
        offering.setModerationNotes(reason);
        supplierOfferingRepository.save(offering);

        recordAudit(offering, admin, "SUSPEND", oldStatus, "SUSPENDED", null, null, null, reason);

        if (offering.getSupplier() != null && offering.getSupplier().getUser() != null) {
            notificationService.createNotification(
                    offering.getSupplier().getUser().getId(),
                    NotificationType.SUPPLIER_OFFERING_MODERATED,
                    "Offering Suspended",
                    "Your offering for " + offering.getMasterProduct().getName() + " was suspended: " + reason,
                    NotificationEntityType.SUPPLIER_OFFERING,
                    offering.getId()
            );
        }

        return getOfferingVerificationDetails(offeringId);
    }

    public SupplierOfferingGovernanceWorkspaceDto deactivateOffering(UUID offeringId, String reason, Authentication authentication) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        User admin = getAuthenticatedUser(authentication);

        String oldStatus = offering.getModerationStatus();
        offering.setModerationStatus("DEACTIVATED");
        offering.setOfferingVerificationStatus("DEACTIVATED");
        offering.setModerationNotes(reason);
        supplierOfferingRepository.save(offering);

        recordAudit(offering, admin, "DEACTIVATE", oldStatus, "DEACTIVATED", null, null, null, reason);
        return getOfferingVerificationDetails(offeringId);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void recordAudit(SupplierOffering offering, User admin, String action, String oldStatus, String newStatus, String fieldName, String oldValue, String newValue, String reason) {
        SupplierOfferingAudit audit = new SupplierOfferingAudit();
        audit.setOfferingId(offering.getId());
        audit.setAdminId(admin.getId());
        audit.setAdminName(admin.getName() != null ? admin.getName() : admin.getEmail());
        audit.setAction(action);
        audit.setPreviousStatus(oldStatus);
        audit.setNewStatus(newStatus);
        audit.setFieldName(fieldName);
        audit.setPreviousValue(oldValue);
        audit.setNewValue(newValue);
        audit.setReason(reason);
        audit.setTimestamp(LocalDateTime.now());
        auditRepository.save(audit);
    }
}
