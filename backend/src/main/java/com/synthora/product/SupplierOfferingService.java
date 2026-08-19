package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationService;
import com.synthora.notification.NotificationType;
import com.synthora.product.dto.CreateSupplierOfferingRequest;
import com.synthora.product.dto.SupplierOfferingResponse;
import com.synthora.product.dto.UpdateSupplierOfferingRequest;
import com.synthora.seller.SupplierIdentityResolver;

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
    private final SupplierIdentityResolver identityResolver;
    private final NotificationService notificationService;

    public SupplierOfferingService(
            SupplierOfferingRepository supplierOfferingRepository,
            MasterProductRepository masterProductRepository,
            UserRepository userRepository,
            SupplierIdentityResolver identityResolver,
            NotificationService notificationService) {
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.masterProductRepository = masterProductRepository;
        this.userRepository = userRepository;
        this.identityResolver = identityResolver;
        this.notificationService = notificationService;
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

        notifySupplier(saved, "Supplier Offering Rejected", "Your commercial offering for " + saved.getMasterProduct().getName() + " was rejected by marketplace governance.");
        return toResponse(saved);
    }

    public SupplierOfferingResponse flagOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("FLAGGED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        notifySupplier(saved, "Supplier Offering Flagged", "Your commercial offering for " + saved.getMasterProduct().getName() + " requires attention. Reason: " + (notes != null ? notes : "Compliance review required."));
        return toResponse(saved);
    }

    public SupplierOfferingResponse requestInfoOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("FLAGGED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        notifySupplier(saved, "Offering Information Requested", "Marketplace governance requested update for " + saved.getMasterProduct().getName() + ": " + (notes != null ? notes : "Please review listing details."));
        return toResponse(saved);
    }

    public SupplierOfferingResponse suspendOffering(UUID offeringId, String notes, Authentication authentication) {
        verifyAdmin(authentication);
        SupplierOffering offering = getOfferingOrThrow(offeringId);
        offering.setModerationStatus("SUSPENDED");
        if (notes != null) offering.setModerationNotes(notes);
        SupplierOffering saved = supplierOfferingRepository.save(offering);

        notifySupplier(saved, "Supplier Offering Suspended", "Your commercial offering for " + saved.getMasterProduct().getName() + " has been suspended.");
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
                offering.getCreatedAt(),
                offering.getUpdatedAt()
        );
    }
}
