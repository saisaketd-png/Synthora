package com.kemkendra.product;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.document.FileSecurityValidator;
import com.kemkendra.document.storage.StorageService;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.CatalogImageResponse;
import com.kemkendra.product.dto.ImageContentResult;
import com.kemkendra.seller.SupplierIdentityResolver;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CatalogImageService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024L; // 5 MB

    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final MasterProductImageRepository masterProductImageRepository;
    private final SupplierOfferingImageRepository supplierOfferingImageRepository;
    private final UserRepository userRepository;
    private final SupplierIdentityResolver supplierIdentityResolver;
    private final FileSecurityValidator fileSecurityValidator;
    private final StorageService storageService;

    public CatalogImageService(
            MasterProductRepository masterProductRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            MasterProductImageRepository masterProductImageRepository,
            SupplierOfferingImageRepository supplierOfferingImageRepository,
            UserRepository userRepository,
            SupplierIdentityResolver supplierIdentityResolver,
            FileSecurityValidator fileSecurityValidator,
            StorageService storageService) {
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.masterProductImageRepository = masterProductImageRepository;
        this.supplierOfferingImageRepository = supplierOfferingImageRepository;
        this.userRepository = userRepository;
        this.supplierIdentityResolver = supplierIdentityResolver;
        this.fileSecurityValidator = fileSecurityValidator;
        this.storageService = storageService;
    }

    // --- MasterProduct Canonical Image Operations ---

    public CatalogImageResponse uploadMasterProductImage(UUID masterProductId, MultipartFile file, String altText, Authentication auth) {
        resolveAdmin(auth);
        MasterProduct mp = masterProductRepository.findById(masterProductId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + masterProductId));

        // Validate image file security & magic bytes
        validateImageBinary(file);

        long currentCount = masterProductImageRepository.countByMasterProductIdAndStatus(masterProductId, "ACTIVE");
        if (currentCount >= 10) {
            throw new IllegalStateException("Maximum limit of 10 images reached for MasterProduct: " + masterProductId);
        }

        String cleanRawName = fileSecurityValidator.sanitizeFilename(file.getOriginalFilename());
        String cleanFileName = UUID.randomUUID() + "_" + cleanRawName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storageKey = "master-products/" + mp.getId() + "/" + cleanFileName;

        try {
            storageService.store(storageKey, file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Failed to read image stream: " + e.getMessage(), e);
        }

        MasterProductImage image = new MasterProductImage();
        image.setMasterProduct(mp);
        image.setStoragePath(storageKey);
        image.setFileName(cleanRawName);
        image.setContentType(file.getContentType());
        image.setFileSize(file.getSize());
        image.setAltText(altText != null ? altText.trim() : mp.getName() + " chemical structure");
        image.setDisplayOrder((int) currentCount + 1);
        image.setStatus("ACTIVE");

        if (currentCount == 0) {
            image.setIsPrimary(true);
        }

        MasterProductImage saved = masterProductImageRepository.save(image);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CatalogImageResponse> getMasterProductImages(UUID masterProductId) {
        return masterProductImageRepository.findByMasterProductIdAndStatusOrderByDisplayOrderAsc(masterProductId, "ACTIVE")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CatalogImageResponse setPrimaryMasterProductImage(UUID masterProductId, UUID imageId, Authentication auth) {
        resolveAdmin(auth);
        List<MasterProductImage> images = masterProductImageRepository.findByMasterProductIdAndStatusOrderByDisplayOrderAsc(masterProductId, "ACTIVE");
        MasterProductImage target = images.stream().filter(img -> img.getId().equals(imageId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Image not found on MasterProduct: " + imageId));

        images.forEach(img -> img.setIsPrimary(img.getId().equals(imageId)));
        return toResponse(target);
    }

    public CatalogImageResponse updateMasterProductImageAltText(UUID masterProductId, UUID imageId, String altText, Authentication auth) {
        resolveAdmin(auth);
        MasterProductImage image = masterProductImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));
        if (!image.getMasterProduct().getId().equals(masterProductId)) {
            throw new AccessDeniedException("Image does not belong to specified MasterProduct");
        }
        image.setAltText(altText != null ? altText.trim() : null);
        return toResponse(image);
    }

    public void deleteMasterProductImage(UUID masterProductId, UUID imageId, Authentication auth) {
        resolveAdmin(auth);
        MasterProductImage image = masterProductImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));
        if (!image.getMasterProduct().getId().equals(masterProductId)) {
            throw new AccessDeniedException("Image does not belong to specified MasterProduct");
        }

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        image.setStatus("DEACTIVATED");
        image.setIsPrimary(false);

        try {
            storageService.delete(image.getStoragePath());
        } catch (Exception ignored) {}

        if (wasPrimary) {
            List<MasterProductImage> remaining = masterProductImageRepository.findByMasterProductIdAndStatusOrderByDisplayOrderAsc(masterProductId, "ACTIVE");
            if (!remaining.isEmpty()) {
                remaining.get(0).setIsPrimary(true);
            }
        }
    }

    @Transactional(readOnly = true)
    public ImageContentResult getMasterProductImageContent(UUID masterProductId, UUID imageId) {
        MasterProductImage image = masterProductImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct image not found: " + imageId));

        if (!image.getMasterProduct().getId().equals(masterProductId)) {
            throw new ResourceNotFoundException("Image does not belong to specified MasterProduct");
        }

        Resource resource = storageService.loadAsResource(image.getStoragePath());
        return new ImageContentResult(resource, image.getContentType(), image.getFileName());
    }

    // --- SupplierOffering Commercial Image Operations ---

    public CatalogImageResponse uploadOfferingImage(UUID offeringId, MultipartFile file, String altText, Authentication auth) {
        User supplierUser = resolveSupplierUser(auth);
        Supplier currentSupplier = supplierIdentityResolver.resolveOperationalSupplier(supplierUser);

        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        if (!offering.getSupplier().getId().equals(currentSupplier.getId())) {
            throw new AccessDeniedException("You do not own this SupplierOffering");
        }

        // Validate image file security & magic bytes
        validateImageBinary(file);

        long currentCount = supplierOfferingImageRepository.countBySupplierOfferingIdAndStatus(offeringId, "ACTIVE");
        if (currentCount >= 10) {
            throw new IllegalStateException("Maximum limit of 10 images reached for SupplierOffering: " + offeringId);
        }

        String cleanRawName = fileSecurityValidator.sanitizeFilename(file.getOriginalFilename());
        String cleanFileName = UUID.randomUUID() + "_" + cleanRawName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storageKey = "offerings/" + offering.getId() + "/" + cleanFileName;

        try {
            storageService.store(storageKey, file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Failed to read image stream: " + e.getMessage(), e);
        }

        SupplierOfferingImage image = new SupplierOfferingImage();
        image.setSupplierOffering(offering);
        image.setStoragePath(storageKey);
        image.setFileName(cleanRawName);
        image.setContentType(file.getContentType());
        image.setFileSize(file.getSize());
        image.setAltText(altText != null ? altText.trim() : offering.getMasterProduct().getName() + " product sample");
        image.setDisplayOrder((int) currentCount + 1);
        image.setStatus("ACTIVE");

        if (currentCount == 0) {
            image.setIsPrimary(true);
        }

        SupplierOfferingImage saved = supplierOfferingImageRepository.save(image);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CatalogImageResponse> getOfferingImages(UUID offeringId) {
        return supplierOfferingImageRepository.findBySupplierOfferingIdAndStatusOrderByDisplayOrderAsc(offeringId, "ACTIVE")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ImageContentResult getOfferingImageContent(UUID offeringId, UUID imageId) {
        SupplierOfferingImage image = supplierOfferingImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering image not found: " + imageId));

        if (!image.getSupplierOffering().getId().equals(offeringId)) {
            throw new ResourceNotFoundException("Image does not belong to specified SupplierOffering");
        }

        Resource resource = storageService.loadAsResource(image.getStoragePath());
        return new ImageContentResult(resource, image.getContentType(), image.getFileName());
    }

    public CatalogImageResponse setPrimaryOfferingImage(UUID offeringId, UUID imageId, Authentication auth) {
        User supplierUser = resolveSupplierUser(auth);
        Supplier currentSupplier = supplierIdentityResolver.resolveOperationalSupplier(supplierUser);

        SupplierOffering offering = supplierOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + offeringId));

        if (!offering.getSupplier().getId().equals(currentSupplier.getId())) {
            throw new AccessDeniedException("You do not own this SupplierOffering");
        }

        List<SupplierOfferingImage> images = supplierOfferingImageRepository.findBySupplierOfferingIdAndStatusOrderByDisplayOrderAsc(offeringId, "ACTIVE");
        SupplierOfferingImage target = images.stream().filter(img -> img.getId().equals(imageId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Image not found on SupplierOffering: " + imageId));

        images.forEach(img -> img.setIsPrimary(img.getId().equals(imageId)));
        return toResponse(target);
    }

    public CatalogImageResponse updateOfferingImageAltText(UUID offeringId, UUID imageId, String altText, Authentication auth) {
        User supplierUser = resolveSupplierUser(auth);
        Supplier currentSupplier = supplierIdentityResolver.resolveOperationalSupplier(supplierUser);

        SupplierOffering imageOffering = supplierOfferingImageRepository.findById(imageId)
                .map(SupplierOfferingImage::getSupplierOffering)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        if (!imageOffering.getId().equals(offeringId) || !imageOffering.getSupplier().getId().equals(currentSupplier.getId())) {
            throw new AccessDeniedException("You do not own this SupplierOffering Image");
        }

        SupplierOfferingImage image = supplierOfferingImageRepository.findById(imageId).get();
        image.setAltText(altText != null ? altText.trim() : null);
        return toResponse(image);
    }

    public void deleteOfferingImage(UUID offeringId, UUID imageId, Authentication auth) {
        User supplierUser = resolveSupplierUser(auth);
        Supplier currentSupplier = supplierIdentityResolver.resolveOperationalSupplier(supplierUser);

        SupplierOfferingImage image = supplierOfferingImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        if (!image.getSupplierOffering().getId().equals(offeringId) || !image.getSupplierOffering().getSupplier().getId().equals(currentSupplier.getId())) {
            throw new AccessDeniedException("You do not own this SupplierOffering Image");
        }

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        image.setStatus("DEACTIVATED");
        image.setIsPrimary(false);

        try {
            storageService.delete(image.getStoragePath());
        } catch (Exception ignored) {}

        if (wasPrimary) {
            List<SupplierOfferingImage> remaining = supplierOfferingImageRepository.findBySupplierOfferingIdAndStatusOrderByDisplayOrderAsc(offeringId, "ACTIVE");
            if (!remaining.isEmpty()) {
                remaining.get(0).setIsPrimary(true);
            }
        }
    }

    // --- Security & Validation Helpers ---

    private void validateImageBinary(MultipartFile file) {
        FileSecurityValidator.ValidatedFileInfo validated = fileSecurityValidator.validate(file, MAX_IMAGE_SIZE_BYTES);
        if (!validated.validatedMimeType().startsWith("image/")) {
            throw new IllegalArgumentException("Uploaded file is not a valid image. Detected MIME: " + validated.validatedMimeType());
        }
    }

    private User resolveAdmin(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Unauthenticated access denied.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User account not found for email: " + auth.getName()));
        if (user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only ADMIN users can perform this catalog image action.");
        }
        return user;
    }

    private User resolveSupplierUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Unauthenticated access denied.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User account not found for email: " + auth.getName()));
        if (user.getRole() != UserRole.SUPPLIER && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only SUPPLIER users can perform this offering image action.");
        }
        return user;
    }

    private CatalogImageResponse toResponse(MasterProductImage img) {
        String url = "/api/v1/master-products/" + img.getMasterProduct().getId() + "/images/" + img.getId() + "/content";
        return new CatalogImageResponse(
                img.getId(),
                url,
                img.getFileName(),
                img.getContentType(),
                img.getFileSize(),
                img.getIsPrimary(),
                img.getDisplayOrder(),
                img.getAltText(),
                img.getStatus(),
                img.getCreatedAt()
        );
    }

    private CatalogImageResponse toResponse(SupplierOfferingImage img) {
        String url = "/api/v1/supplier/offerings/" + img.getSupplierOffering().getId() + "/images/" + img.getId() + "/content";
        return new CatalogImageResponse(
                img.getId(),
                url,
                img.getFileName(),
                img.getContentType(),
                img.getFileSize(),
                img.getIsPrimary(),
                img.getDisplayOrder(),
                img.getAltText(),
                img.getStatus(),
                img.getCreatedAt()
        );
    }
}
