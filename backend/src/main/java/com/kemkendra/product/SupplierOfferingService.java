package com.kemkendra.product;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.notification.NotificationService;
import com.kemkendra.notification.NotificationType;
import com.kemkendra.product.dto.CreateSupplierOfferingRequest;
import com.kemkendra.product.dto.SupplierOfferingResponse;
import com.kemkendra.product.dto.UpdateSupplierOfferingRequest;
import com.kemkendra.seller.SupplierIdentityResolver;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class SupplierOfferingService {

    public static final Set<String> SUPPORTED_CURRENCIES = Set.of("INR", "USD", "EUR", "GBP");

    private final SupplierOfferingRepository supplierOfferingRepository;
    private final MasterProductRepository masterProductRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierIdentityResolver identityResolver;
    private final NotificationService notificationService;
    private final com.kemkendra.admin.audit.AuditService auditService;
    private final com.kemkendra.seller.SupplierPerformanceService supplierPerformanceService;

    public SupplierOfferingService(
            SupplierOfferingRepository supplierOfferingRepository,
            MasterProductRepository masterProductRepository,
            UserRepository userRepository,
            SupplierRepository supplierRepository,
            SupplierIdentityResolver identityResolver,
            NotificationService notificationService,
            com.kemkendra.admin.audit.AuditService auditService,
            com.kemkendra.seller.SupplierPerformanceService supplierPerformanceService) {
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.masterProductRepository = masterProductRepository;
        this.userRepository = userRepository;
        this.supplierRepository = supplierRepository;
        this.identityResolver = identityResolver;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.supplierPerformanceService = supplierPerformanceService;
    }

    /**
     * Supplier creates commercial offering on a MasterProduct.
     * Supplier identity is strictly resolved from JWT authentication principal.
     */
    public SupplierOfferingResponse createOffering(
            CreateSupplierOfferingRequest request,
            Authentication authentication) {

        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        MasterProduct masterProduct = masterProductRepository.findById(request.masterProductId())
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + request.masterProductId()));

        if (supplierOfferingRepository.existsByMasterProductIdAndSupplierId(masterProduct.getId(), supplier.getId())) {
            throw new IllegalStateException("You already have an offering for this MasterProduct.");
        }

        String currency = validateCurrency(request.currency());

        SupplierOffering offering = new SupplierOffering();
        offering.setMasterProduct(masterProduct);
        offering.setSupplier(supplier);
        offering.setPrice(request.price());
        offering.setCurrency(currency);
        offering.setStock(request.stock() != null ? request.stock() : 0);
        offering.setPurity(request.purity());
        offering.setGrade(request.grade());
        offering.setMoqKg(request.moqKg());
        offering.setPackaging(request.packaging());
        offering.setLeadTimeDays(request.leadTimeDays());
        offering.setCoaAvailable(request.coaAvailable() != null ? request.coaAvailable() : false);
        offering.setMsdsAvailable(request.msdsAvailable() != null ? request.msdsAvailable() : false);
        offering.setExportReady(request.exportReady() != null ? request.exportReady() : false);
        offering.setAvailabilityStatus(request.availabilityStatus() != null ? request.availabilityStatus() : "AVAILABLE");
        offering.setModerationStatus("PENDING_REVIEW");

        SupplierOffering saved = supplierOfferingRepository.save(offering);

        // Audit Log
        try {
            auditService.recordUserAction(
                    user,
                    com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_CREATED,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                    saved.getId().toString(),
                    "Supplier " + supplier.getName() + " created commercial offering for " + masterProduct.getName() + " (" + masterProduct.getMasterProductCode() + ").",
                    null
            );
        } catch (Exception ignored) {}

        // Notify Admins
        notificationService.notifyAdmins(
                NotificationType.SUPPLIER_OFFERING_SUBMITTED,
                "New Supplier Offering Requires Review",
                "Supplier " + supplier.getName() + " submitted a new offering for " + masterProduct.getName() + " (" + masterProduct.getMasterProductCode() + ").",
                NotificationEntityType.SUPPLIER_OFFERING,
                saved.getId()
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SupplierOfferingResponse getOfferingById(UUID offeringId) {
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
        return toResponse(offering);
    }

    @Transactional(readOnly = true)
    public SupplierOfferingResponse getOfferingById(UUID offeringId, Authentication authentication) {
        User user = resolveUser(authentication);
        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        if (user.getRole() == UserRole.SUPPLIER) {
            Supplier supplier = identityResolver.resolveOperationalSupplier(user);
            if (!offering.getSupplier().getId().equals(supplier.getId())) {
                throw new AccessDeniedException("You cannot access another supplier's offering");
            }
        }
        return toResponse(offering);
    }

    @Transactional(readOnly = true)
    public List<SupplierOfferingResponse> getOfferingsForMasterProduct(UUID masterProductId) {
        return supplierOfferingRepository.findByMasterProductId(masterProductId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupplierOfferingResponse> getMyOfferings(Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        return supplierOfferingRepository.findBySupplierId(supplier.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Supplier updates their own offering. Enforces ownership check (IDOR/BOLA protection).
     */
    public SupplierOfferingResponse updateOffering(
            UUID offeringId,
            UpdateSupplierOfferingRequest request,
            Authentication authentication) {

        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        if (!offering.getSupplier().getId().equals(supplier.getId())) {
            throw new AccessDeniedException("You cannot modify another supplier's offering");
        }

        boolean criticalChange = (request.price() != null && !request.price().equals(offering.getPrice()))
                || (request.purity() != null && !request.purity().equals(offering.getPurity()))
                || (request.grade() != null && !request.grade().equals(offering.getGrade()))
                || (request.moqKg() != null && !request.moqKg().equals(offering.getMoqKg()))
                || (request.packaging() != null && !request.packaging().equals(offering.getPackaging()));

        if (request.price() != null) offering.setPrice(request.price());
        if (request.currency() != null) offering.setCurrency(validateCurrency(request.currency()));
        if (request.stock() != null) offering.setStock(request.stock());
        if (request.purity() != null) offering.setPurity(request.purity());
        if (request.grade() != null) offering.setGrade(request.grade());
        if (request.moqKg() != null) offering.setMoqKg(request.moqKg());
        if (request.packaging() != null) offering.setPackaging(request.packaging());
        if (request.leadTimeDays() != null) offering.setLeadTimeDays(request.leadTimeDays());
        if (request.coaAvailable() != null) offering.setCoaAvailable(request.coaAvailable());
        if (request.msdsAvailable() != null) offering.setMsdsAvailable(request.msdsAvailable());
        if (request.exportReady() != null) offering.setExportReady(request.exportReady());
        if (request.availabilityStatus() != null) offering.setAvailabilityStatus(request.availabilityStatus());

        if (criticalChange) {
            offering.setModerationStatus("PENDING_REVIEW");
            offering.setOfferingVerificationStatus("UNVERIFIED");
        }

        SupplierOffering updated = supplierOfferingRepository.save(offering);

        // Audit Log
        try {
            auditService.recordUserAction(
                    user,
                    com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_UPDATED,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                    updated.getId().toString(),
                    "Supplier " + supplier.getName() + " updated commercial parameters for offering " + offering.getMasterProduct().getName() + ".",
                    null
            );
        } catch (Exception ignored) {}

        // Notify Admins
        notificationService.notifyAdmins(
                NotificationType.SUPPLIER_OFFERING_UPDATED,
                "Supplier Offering Updated",
                "Supplier " + supplier.getName() + " updated offering details for " + offering.getMasterProduct().getName() + ".",
                NotificationEntityType.SUPPLIER_OFFERING,
                updated.getId()
        );

        return toResponse(updated);
    }

    /**
     * Supplier deactivates their own offering. Enforces ownership check.
     */
    public SupplierOfferingResponse deactivateOffering(UUID offeringId, Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        if (!offering.getSupplier().getId().equals(supplier.getId())) {
            throw new AccessDeniedException("You cannot modify another supplier's offering");
        }

        offering.setAvailabilityStatus("HIDDEN");
        offering.setModerationStatus("DEACTIVATED");
        SupplierOffering updated = supplierOfferingRepository.save(offering);

        // Audit Log
        try {
            auditService.recordUserAction(
                    user,
                    com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_DEACTIVATED,
                    com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                    updated.getId().toString(),
                    "Supplier " + supplier.getName() + " deactivated commercial offering for " + offering.getMasterProduct().getName() + ".",
                    null
            );
        } catch (Exception ignored) {}

        return toResponse(updated);
    }

    // -----------------------------------------------------------------------
    // Admin Moderation Operations
    // -----------------------------------------------------------------------

    public SupplierOfferingResponse approveOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("APPROVED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        // Audit Log
        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_APPROVED,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Approved commercial offering for " + saved.getMasterProduct().getName() + " (Supplier: " + (saved.getSupplier() != null ? saved.getSupplier().getName() : "N/A") + "). Notes: " + (notes != null ? notes : "Approved"),
                "127.0.0.1"
        );

        // Notify Supplier User
        notifySupplier(saved, "Supplier Offering Approved", "Your commercial offering for " + saved.getMasterProduct().getName() + " has been approved for marketplace publication.");
        return toResponse(saved);
    }

    public SupplierOfferingResponse rejectOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("REJECTED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_REJECTED,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Rejected commercial offering for " + saved.getMasterProduct().getName() + ". Reason: " + (notes != null ? notes : "Rejected"),
                "127.0.0.1"
        );

        notifySupplier(saved, "Supplier Offering Rejected", "Your commercial offering for " + saved.getMasterProduct().getName() + " was rejected by marketplace governance.");
        return toResponse(saved);
    }

    public SupplierOfferingResponse flagOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("FLAGGED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_FLAGGED,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Flagged commercial offering for " + saved.getMasterProduct().getName() + ". Reason: " + (notes != null ? notes : "Flagged"),
                "127.0.0.1"
        );

        notifySupplier(saved, "Supplier Offering Flagged", "Your commercial offering for " + saved.getMasterProduct().getName() + " requires attention. Reason: " + (notes != null ? notes : "Compliance review required."));
        return toResponse(saved);
    }

    public SupplierOfferingResponse requestInfoOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("FLAGGED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_FLAGGED,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Requested info for offering " + saved.getMasterProduct().getName() + ". Notes: " + (notes != null ? notes : "Information required"),
                "127.0.0.1"
        );

        notifySupplier(saved, "Offering Information Requested", "Marketplace governance requested update for " + saved.getMasterProduct().getName() + ": " + (notes != null ? notes : "Please review listing details."));
        return toResponse(saved);
    }

    public SupplierOfferingResponse suspendOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("SUSPENDED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_FLAGGED,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Suspended offering " + saved.getMasterProduct().getName() + ". Reason: " + (notes != null ? notes : "Suspended"),
                "127.0.0.1"
        );

        notifySupplier(saved, "Supplier Offering Suspended", "Your commercial offering for " + saved.getMasterProduct().getName() + " has been suspended.");
        return toResponse(saved);
    }

    /**
     * Admin creates a commercial offering on behalf of a specific Supplier.
     * Supplier owns the offering; provenance is attributed to Admin.
     */
    public SupplierOfferingResponse createOfferingOnBehalfOfSupplier(
            com.kemkendra.product.dto.AdminCreateSupplierOfferingRequest request,
            Authentication authentication) {

        verifyAdmin(authentication);
        User adminUser = resolveUser(authentication);

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + request.supplierId()));

        MasterProduct masterProduct = masterProductRepository.findById(request.masterProductId())
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + request.masterProductId()));

        if (supplierOfferingRepository.existsByMasterProductIdAndSupplierId(masterProduct.getId(), supplier.getId())) {
            throw new IllegalStateException("Supplier '" + supplier.getName() + "' already has an offering for MasterProduct '" + masterProduct.getName() + "'.");
        }

        String currency = validateCurrency(request.currency());

        SupplierOffering offering = new SupplierOffering();
        offering.setMasterProduct(masterProduct);
        offering.setSupplier(supplier);
        offering.setPrice(request.price());
        offering.setCurrency(currency);
        offering.setStock(request.stock() != null ? request.stock() : 0);
        offering.setPurity(request.purity());
        offering.setGrade(request.grade());
        offering.setMoqKg(request.moqKg());
        offering.setPackaging(request.packaging());
        offering.setLeadTimeDays(request.leadTimeDays());
        offering.setCoaAvailable(request.coaAvailable() != null ? request.coaAvailable() : false);
        offering.setMsdsAvailable(request.msdsAvailable() != null ? request.msdsAvailable() : false);
        offering.setExportReady(request.exportReady() != null ? request.exportReady() : false);
        offering.setAvailabilityStatus(request.availabilityStatus() != null ? request.availabilityStatus() : "AVAILABLE");
        offering.setModerationStatus(request.moderationStatus() != null ? request.moderationStatus() : "APPROVED");
        if (request.adminNotes() != null) {
            offering.setModerationNotes(request.adminNotes());
        }

        // Provenance attribution
        offering.setCreatedByRole("ADMIN");
        offering.setCreatedByAdminId(adminUser.getId());
        offering.setCreatedByAdminName(adminUser.getName());

        SupplierOffering saved = supplierOfferingRepository.save(offering);

        // Audit log
        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_CREATED_BY_ADMIN,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Created commercial offering on behalf of supplier " + supplier.getName() + " for " + masterProduct.getName() + " (" + masterProduct.getMasterProductCode() + "). Notes: " + (request.adminNotes() != null ? request.adminNotes() : "Admin created on behalf of supplier"),
                "127.0.0.1"
        );

        // Notify Supplier User (non-blocking)
        try {
            notifySupplier(saved, "New Offering Listed by Platform Operator",
                    "A commercial offering for " + masterProduct.getName() + " (" + masterProduct.getMasterProductCode() + ") has been listed on your behalf by KemKendra Admin.");
        } catch (Exception ignored) {}

        return toResponse(saved);
    }

    /**
     * Admin updates offering parameters on behalf of supplier.
     */
    public SupplierOfferingResponse adminUpdateOffering(
            UUID offeringId,
            com.kemkendra.product.dto.AdminUpdateSupplierOfferingRequest request,
            Authentication authentication) {

        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);

        if (request.price() != null) offering.setPrice(request.price());
        if (request.currency() != null) offering.setCurrency(validateCurrency(request.currency()));
        if (request.stock() != null) offering.setStock(request.stock());
        if (request.purity() != null) offering.setPurity(request.purity());
        if (request.grade() != null) offering.setGrade(request.grade());
        if (request.moqKg() != null) offering.setMoqKg(request.moqKg());
        if (request.packaging() != null) offering.setPackaging(request.packaging());
        if (request.leadTimeDays() != null) offering.setLeadTimeDays(request.leadTimeDays());
        if (request.coaAvailable() != null) offering.setCoaAvailable(request.coaAvailable());
        if (request.msdsAvailable() != null) offering.setMsdsAvailable(request.msdsAvailable());
        if (request.exportReady() != null) offering.setExportReady(request.exportReady());
        if (request.availabilityStatus() != null) offering.setAvailabilityStatus(request.availabilityStatus());
        if (request.moderationStatus() != null) offering.setModerationStatus(request.moderationStatus());
        if (request.moderationNotes() != null) offering.setModerationNotes(request.moderationNotes());
        if (request.adminNotes() != null) offering.setAdminRequestInfoNotes(request.adminNotes());

        SupplierOffering updated = supplierOfferingRepository.save(offering);

        auditService.record(
                authentication,
                com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_UPDATED,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                updated.getId().toString(),
                "Admin updated commercial offering for " + updated.getMasterProduct().getName() + " (Supplier: " + (updated.getSupplier() != null ? updated.getSupplier().getName() : "N/A") + ").",
                "127.0.0.1"
        );

        return toResponse(updated);
    }

    /**
     * Admin activates or deactivates an offering.
     */
    public SupplierOfferingResponse adminSetOfferingStatus(
            UUID offeringId,
            String status,
            Authentication authentication) {

        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);

        String normalizedStatus = status != null ? status.trim().toUpperCase() : "AVAILABLE";
        com.kemkendra.admin.audit.AuditAction auditAction;
        if ("INACTIVE".equals(normalizedStatus) || "HIDDEN".equals(normalizedStatus) || "DEACTIVATED".equals(normalizedStatus)) {
            offering.setAvailabilityStatus("HIDDEN");
            offering.setModerationStatus("DEACTIVATED");
            auditAction = com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_DEACTIVATED;
        } else if ("ACTIVE".equals(normalizedStatus) || "AVAILABLE".equals(normalizedStatus) || "APPROVED".equals(normalizedStatus)) {
            offering.setAvailabilityStatus("AVAILABLE");
            offering.setModerationStatus("APPROVED");
            auditAction = com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_ACTIVATED;
        } else {
            offering.setAvailabilityStatus(normalizedStatus);
            auditAction = com.kemkendra.admin.audit.AuditAction.SUPPLIER_OFFERING_UPDATED;
        }

        SupplierOffering saved = supplierOfferingRepository.save(offering);

        auditService.record(
                authentication,
                auditAction,
                com.kemkendra.admin.audit.AuditTargetType.SUPPLIER_OFFERING,
                saved.getId().toString(),
                "Admin set offering status to " + normalizedStatus + " for " + saved.getMasterProduct().getName() + " (Supplier: " + (saved.getSupplier() != null ? saved.getSupplier().getName() : "N/A") + ").",
                "127.0.0.1"
        );

        return toResponse(saved);
    }

    private void verifyAdmin(Authentication authentication) {
        User user = resolveUser(authentication);
        if (user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Admin access required for offering governance operations");
        }
    }

    private SupplierOffering getOfferingOrThrow(UUID offeringId) {
        return supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));
    }

    private void notifySupplier(SupplierOffering offering, String title, String message) {
        Supplier sup = offering.getSupplier();
        if (sup != null && sup.getUser() != null) {
            notificationService.createNotification(
                    sup.getUser().getId(),
                    NotificationType.SUPPLIER_OFFERING_MODERATED,
                    title,
                    message,
                    NotificationEntityType.SUPPLIER_OFFERING,
                    offering.getId()
            );
        }
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private String validateCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "INR";
        }
        String norm = currency.trim().toUpperCase();
        if (!SUPPORTED_CURRENCIES.contains(norm)) {
            throw new IllegalArgumentException("Unsupported currency: " + currency + ". Supported currencies are: " + SUPPORTED_CURRENCIES);
        }
        return norm;
    }

    private SupplierOfferingResponse toResponse(SupplierOffering offering) {
        MasterProduct mp = offering.getMasterProduct();
        com.kemkendra.product.dto.SupplierPerformanceResponse perf = null;
        if (offering.getSupplier() != null && offering.getSupplier().getId() != null) {
            perf = supplierPerformanceService.getSupplierPerformance(offering.getSupplier().getId());
        }

        return new SupplierOfferingResponse(
                offering.getId(),
                mp.getId(),
                mp.getMasterProductCode(),
                mp.getName(),
                mp.getCasNumber(),
                mp.getMolecularFormula(),
                mp.getCategory() != null ? mp.getCategory().name() : null,
                offering.getSupplier().getId(),
                offering.getSupplier().getName(),
                offering.getPrice(),
                offering.getCurrency(),
                offering.getStock(),
                offering.getPurity(),
                offering.getGrade(),
                offering.getMoqKg(),
                offering.getPackaging(),
                offering.getLeadTimeDays(),
                offering.getCoaAvailable(),
                offering.getMsdsAvailable(),
                offering.getExportReady(),
                offering.getAvailabilityStatus(),
                offering.getModerationStatus() != null ? offering.getModerationStatus() : "PENDING_REVIEW",
                offering.getModerationNotes(),
                offering.getSupplier() != null ? offering.getSupplier().getLogoUrl() : null,
                offering.getSupplier() != null ? Boolean.TRUE.equals(offering.getSupplier().getVerified()) : false,
                perf != null ? perf.responseRate() : null,
                perf != null ? perf.averageResponseTimeSeconds() : null,
                perf != null ? perf.formattedResponseTime() : null,
                offering.getCreatedByRole(),
                offering.getCreatedByAdminId(),
                offering.getCreatedByAdminName(),
                offering.getCreatedAt(),
                offering.getUpdatedAt()
        );
    }
}
