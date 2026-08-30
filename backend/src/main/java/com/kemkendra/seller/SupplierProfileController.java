package com.kemkendra.seller;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditService;
import com.kemkendra.admin.audit.AuditTargetType;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.document.FileSecurityValidator;
import com.kemkendra.document.storage.StorageService;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.notification.NotificationService;
import com.kemkendra.notification.NotificationType;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.dto.SupplierProfileResponse;
import com.kemkendra.seller.dto.UpdateSupplierProfileRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/supplier")
@PreAuthorize("hasRole('SUPPLIER')")
@Transactional
public class SupplierProfileController {

    private static final Logger log = LoggerFactory.getLogger(SupplierProfileController.class);
    private static final long MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024L; // 5 MB

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final SupplierIdentityResolver identityResolver;
    private final SellerProfileRepository sellerProfileRepository;
    private final StorageService storageService;
    private final FileSecurityValidator fileSecurityValidator;
    private final NotificationService notificationService;
    private final SupplierVerificationAuditRepository auditRepository;
    private final SupplierPerformanceService supplierPerformanceService;

    public SupplierProfileController(
            SupplierRepository supplierRepository,
            UserRepository userRepository,
            SupplierIdentityResolver identityResolver,
            SellerProfileRepository sellerProfileRepository,
            StorageService storageService,
            FileSecurityValidator fileSecurityValidator,
            NotificationService notificationService,
            SupplierVerificationAuditRepository auditRepository,
            SupplierPerformanceService supplierPerformanceService) {
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.identityResolver = identityResolver;
        this.sellerProfileRepository = sellerProfileRepository;
        this.storageService = storageService;
        this.fileSecurityValidator = fileSecurityValidator;
        this.notificationService = notificationService;
        this.auditRepository = auditRepository;
        this.supplierPerformanceService = supplierPerformanceService;
    }

    @GetMapping("/profile")
    public ResponseEntity<SupplierProfileResponse> getMyProfile(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        return ResponseEntity.ok(toResponse(supplier));
    }

    @GetMapping("/performance")
    public ResponseEntity<com.kemkendra.product.dto.SupplierPerformanceResponse> getMyPerformance(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        return ResponseEntity.ok(supplierPerformanceService.getSupplierPerformance(supplier.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<SupplierProfileResponse> updateMyProfile(
            @RequestBody UpdateSupplierProfileRequest req,
            Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        // Update company identity fields
        if (req.name() != null && !req.name().isBlank()) supplier.setName(req.name().trim());
        if (req.legalName() != null) supplier.setLegalName(req.legalName().trim());
        if (req.tradeName() != null) supplier.setTradeName(req.tradeName().trim());
        if (req.businessType() != null) supplier.setBusinessType(req.businessType().trim().toUpperCase());
        if (req.registeredAddress() != null) supplier.setRegisteredAddress(req.registeredAddress().trim());
        if (req.stateProvince() != null) supplier.setStateProvince(req.stateProvince().trim());
        if (req.city() != null) supplier.setCity(req.city().trim());
        if (req.postalCode() != null) supplier.setPostalCode(req.postalCode().trim());
        if (req.countryCode() != null && !req.countryCode().isBlank()) supplier.setCountryCode(req.countryCode().trim().toUpperCase());
        if (req.countryName() != null && !req.countryName().isBlank()) supplier.setCountryName(req.countryName().trim());
        if (req.businessEmail() != null) supplier.setBusinessEmail(req.businessEmail().trim());
        if (req.businessPhone() != null) supplier.setBusinessPhone(req.businessPhone().trim());
        if (req.authorizedRepresentativeName() != null) supplier.setAuthorizedRepresentativeName(req.authorizedRepresentativeName().trim());
        if (req.authorizedRepresentativeDesignation() != null) supplier.setAuthorizedRepresentativeDesignation(req.authorizedRepresentativeDesignation().trim());
        if (req.website() != null) supplier.setWebsite(req.website().trim());
        if (req.taxVatNumber() != null) supplier.setTaxVatNumber(req.taxVatNumber().trim());
        if (req.companyRegistrationNumber() != null) supplier.setCompanyRegistrationNumber(req.companyRegistrationNumber().trim());
        if (req.businessDescription() != null) supplier.setBusinessDescription(req.businessDescription().trim());
        if (req.countriesServed() != null) supplier.setCountriesServed(req.countriesServed().trim());
        if (req.primaryCategories() != null) supplier.setPrimaryCategories(req.primaryCategories().trim());
        if (req.yearsInBusiness() != null) supplier.setYearsInBusiness(req.yearsInBusiness());
        if (req.exportReady() != null) supplier.setExportReady(req.exportReady());

        Supplier saved = supplierRepository.save(supplier);

        // Sync with editable SellerProfile entity
        identityResolver.resolveEditableProfile(user).ifPresent(profile -> {
            if (req.name() != null && !req.name().isBlank()) profile.setCompanyName(req.name().trim());
            if (req.city() != null) profile.setCity(req.city().trim());
            if (req.countryName() != null && !req.countryName().isBlank()) profile.setCountry(req.countryName().trim());
            if (req.website() != null) profile.setWebsite(req.website().trim());
            if (req.businessDescription() != null) profile.setAboutCompany(req.businessDescription().trim());
            sellerProfileRepository.save(profile);
        });

        return ResponseEntity.ok(toResponse(saved));
    }

    @PostMapping("/profile/logo")
    public ResponseEntity<SupplierProfileResponse> uploadLogo(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        validateLogoFile(file);

        String cleanRawName = fileSecurityValidator.sanitizeFilename(file.getOriginalFilename());
        String cleanFileName = UUID.randomUUID() + "_" + cleanRawName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storageKey = "suppliers/" + supplier.getId() + "/logo/" + cleanFileName;

        try {
            storageService.store(storageKey, file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Failed to save logo file: " + e.getMessage(), e);
        }

        String logoUrl = "/api/v1/suppliers/" + supplier.getId() + "/logo";
        supplier.setLogoUrl(logoUrl);
        supplier.setLogoStoragePath(storageKey);
        supplier.setLogoContentType(file.getContentType());
        Supplier saved = supplierRepository.save(supplier);

        auditRepository.save(new SupplierVerificationAudit(
                saved.getId(),
                user.getId(),
                user.getName(),
                saved.getVerificationStatus() != null ? saved.getVerificationStatus() : SupplierVerificationStatus.DRAFT,
                saved.getVerificationStatus() != null ? saved.getVerificationStatus() : SupplierVerificationStatus.DRAFT,
                "Uploaded company logo: " + cleanRawName
        ));

        return ResponseEntity.ok(toResponse(saved));
    }

    @DeleteMapping("/profile/logo")
    public ResponseEntity<SupplierProfileResponse> deleteLogo(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        supplier.setLogoUrl(null);
        supplier.setLogoStoragePath(null);
        supplier.setLogoContentType(null);
        Supplier saved = supplierRepository.save(supplier);

        auditRepository.save(new SupplierVerificationAudit(
                saved.getId(),
                user.getId(),
                user.getName(),
                saved.getVerificationStatus() != null ? saved.getVerificationStatus() : SupplierVerificationStatus.DRAFT,
                saved.getVerificationStatus() != null ? saved.getVerificationStatus() : SupplierVerificationStatus.DRAFT,
                "Removed company logo."
        ));

        return ResponseEntity.ok(toResponse(saved));
    }

    @PostMapping("/verification/submit")
    public ResponseEntity<SupplierProfileResponse> submitVerification(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        SupplierVerificationStatus oldStatus = supplier.getVerificationStatus() != null
                ? supplier.getVerificationStatus()
                : SupplierVerificationStatus.PENDING;

        supplier.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplier.setVerificationUpdatedAt(LocalDateTime.now());
        Supplier saved = supplierRepository.save(supplier);

        // Record Audit
        auditRepository.save(new SupplierVerificationAudit(
                saved.getId(),
                user.getId(),
                user.getName(),
                oldStatus,
                SupplierVerificationStatus.PENDING,
                "Supplier submitted company verification application."
        ));

        // Notify Supplier
        notificationService.createNotification(
                user.getId(),
                NotificationType.SUPPLIER_VERIFICATION_SUBMITTED,
                "Verification Request Submitted",
                "Your company verification request has been submitted for KemKendra marketplace review.",
                NotificationEntityType.SUPPLIER,
                UUID.nameUUIDFromBytes(("supplier:" + saved.getId()).getBytes())
        );

        // Notify All Admins
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    NotificationType.SUPPLIER_VERIFICATION_SUBMITTED,
                    "New Supplier Verification Pending",
                    "Supplier " + saved.getName() + " has submitted company profile for verification.",
                    NotificationEntityType.SUPPLIER,
                    UUID.nameUUIDFromBytes(("supplier:" + saved.getId()).getBytes())
            );
        }

        return ResponseEntity.ok(toResponse(saved));
    }

    @PostMapping("/verification/verify-email")
    public ResponseEntity<SupplierProfileResponse> verifyEmail(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        supplier.setEmailVerified(true);
        Supplier saved = supplierRepository.save(supplier);
        return ResponseEntity.ok(toResponse(saved));
    }

    @PostMapping("/verification/verify-phone")
    public ResponseEntity<SupplierProfileResponse> verifyPhone(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        supplier.setPhoneVerified(true);
        Supplier saved = supplierRepository.save(supplier);
        return ResponseEntity.ok(toResponse(saved));
    }

    @GetMapping("/verification/status")
    public ResponseEntity<Map<String, Object>> getVerificationStatus(Authentication auth) {
        User user = resolveAuthenticatedUser(auth);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        return ResponseEntity.ok(Map.of(
                "supplierId", supplier.getId(),
                "name", supplier.getName(),
                "verificationStatus", supplier.getVerificationStatus() != null ? supplier.getVerificationStatus().name() : "PENDING",
                "verified", Boolean.TRUE.equals(supplier.getVerified()),
                "emailVerified", Boolean.TRUE.equals(supplier.getEmailVerified()),
                "phoneVerified", Boolean.TRUE.equals(supplier.getPhoneVerified()),
                "verificationNotes", supplier.getVerificationNotes() != null ? supplier.getVerificationNotes() : "",
                "adminRequestInfoNotes", supplier.getAdminRequestInfoNotes() != null ? supplier.getAdminRequestInfoNotes() : ""
        ));
    }

    private User resolveAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void validateLogoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Logo file is required and cannot be empty.");
        }
        if (file.getSize() > MAX_LOGO_SIZE_BYTES) {
            throw new IllegalArgumentException("Logo file exceeds maximum size limit of 5 MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/png") &&
                !contentType.equalsIgnoreCase("image/jpeg") &&
                !contentType.equalsIgnoreCase("image/webp"))) {
            throw new IllegalArgumentException("Invalid image type: " + contentType + ". Supported formats: PNG, JPG, WEBP.");
        }

        try {
            byte[] header = file.getInputStream().readNBytes(12);
            boolean isPng = header.length >= 8 && header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
            boolean isJpeg = header.length >= 3 && header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF;
            boolean isWebp = header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';

            if (!isPng && !isJpeg && !isWebp) {
                throw new IllegalArgumentException("Corrupted image or invalid binary signature.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read image content for validation: " + e.getMessage());
        }
    }

    private SupplierProfileResponse toResponse(Supplier s) {
        return new SupplierProfileResponse(
                s.getId(),
                s.getUser() != null ? s.getUser().getId() : null,
                s.getName(),
                s.getSlug(),
                s.getLegalName() != null ? s.getLegalName() : s.getName(),
                s.getTradeName(),
                s.getBusinessType(),
                s.getRegisteredAddress(),
                s.getStateProvince(),
                s.getCity(),
                s.getPostalCode(),
                s.getCountryCode(),
                s.getCountryName(),
                s.getBusinessEmail(),
                s.getBusinessPhone(),
                s.getAuthorizedRepresentativeName(),
                s.getAuthorizedRepresentativeDesignation(),
                Boolean.TRUE.equals(s.getEmailVerified()),
                Boolean.TRUE.equals(s.getPhoneVerified()),
                s.getWebsite(),
                s.getTaxVatNumber(),
                s.getCompanyRegistrationNumber(),
                s.getBusinessDescription(),
                s.getCountriesServed(),
                s.getPrimaryCategories(),
                s.getLogoUrl(),
                Boolean.TRUE.equals(s.getVerified()),
                s.getYearsInBusiness(),
                Boolean.TRUE.equals(s.getExportReady()),
                s.getVerificationStatus() != null ? s.getVerificationStatus().name() : "PENDING",
                s.getVerificationNotes(),
                s.getAdminRequestInfoNotes(),
                s.getSupplierResponseNotes(),
                s.getCreatedAt(),
                s.getVerificationUpdatedAt()
        );
    }
}
