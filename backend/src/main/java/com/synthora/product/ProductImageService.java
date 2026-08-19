package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.document.FileSecurityValidator;
import com.synthora.document.storage.StorageService;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.dto.ProductImageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductImageService {

    private static final int MAX_IMAGES_PER_PRODUCT = 5;
    private static final Set<String> ALLOWED_IMAGE_MIMES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final FileSecurityValidator fileSecurityValidator;
    private final long maxFileSize;

    public ProductImageService(ProductRepository productRepository,
                               ProductImageRepository productImageRepository,
                               UserRepository userRepository,
                               StorageService storageService,
                               FileSecurityValidator fileSecurityValidator,
                               @Value("${synthora.products.max-image-size:5242880}") long maxFileSize) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.fileSecurityValidator = fileSecurityValidator;
        this.maxFileSize = maxFileSize;
    }

    @Transactional
    public ProductImageResponse uploadProductImage(UUID productId, MultipartFile file, Authentication authentication) {
        User user = resolveUser(authentication);
        Product product = resolveProduct(productId);

        verifyProductOwnership(product, user);

        long currentImageCount = productImageRepository.countByProductId(productId);
        if (currentImageCount >= MAX_IMAGES_PER_PRODUCT) {
            throw new IllegalArgumentException("Maximum of " + MAX_IMAGES_PER_PRODUCT + " images allowed per product.");
        }

        // Validate MIME type & binary magic bytes using Phase 2H.5 FileSecurityValidator
        FileSecurityValidator.ValidatedFileInfo validated = fileSecurityValidator.validate(file, maxFileSize);

        if (!ALLOWED_IMAGE_MIMES.contains(validated.validatedMimeType())) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WebP image formats are permitted for product images.");
        }

        String storageKey = "product-images/" + productId + "/" + UUID.randomUUID() + validated.safeExtension();

        try {
            storageService.store(storageKey, file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Failed to store product image", e);
        }

        boolean isFirstImage = currentImageCount == 0;

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setStorageKey(storageKey);
        image.setFileName(validated.safeOriginalFilename());
        image.setContentType(validated.validatedMimeType());
        image.setFileSize(file.getSize());
        image.setIsPrimary(isFirstImage);
        image.setDisplayOrder((int) currentImageCount);
        image.setUploadedBy(user);

        ProductImage saved = productImageRepository.save(image);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductImageResponse> getProductImages(UUID productId) {
        // Verify product exists
        resolveProduct(productId);
        return productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductImageResponse setPrimaryImage(UUID productId, UUID imageId, Authentication authentication) {
        User user = resolveUser(authentication);
        Product product = resolveProduct(productId);

        verifyProductOwnership(product, user);

        ProductImage targetImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));

        if (!targetImage.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Image does not belong to this product");
        }

        List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        for (ProductImage img : images) {
            img.setIsPrimary(img.getId().equals(imageId));
        }
        productImageRepository.saveAll(images);

        targetImage.setIsPrimary(true);
        return toResponse(targetImage);
    }

    @Transactional
    public void deleteProductImage(UUID productId, UUID imageId, Authentication authentication) {
        User user = resolveUser(authentication);
        Product product = resolveProduct(productId);

        verifyProductOwnership(product, user);

        ProductImage targetImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));

        if (!targetImage.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Image does not belong to this product");
        }

        boolean wasPrimary = Boolean.TRUE.equals(targetImage.getIsPrimary());

        // Delete storage resource
        try {
            storageService.delete(targetImage.getStorageKey());
        } catch (Exception ignored) {}

        productImageRepository.delete(targetImage);

        // If the deleted image was primary, promote the next remaining image to primary
        if (wasPrimary) {
            List<ProductImage> remaining = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
            if (!remaining.isEmpty()) {
                ProductImage nextPrimary = remaining.get(0);
                nextPrimary.setIsPrimary(true);
                productImageRepository.save(nextPrimary);
            }
        }
    }

    @Transactional(readOnly = true)
    public ImageContentResult getImageContent(UUID productId, UUID imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));

        if (!image.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Image does not belong to specified product");
        }

        Resource resource = storageService.loadAsResource(image.getStorageKey());
        return new ImageContentResult(resource, image.getContentType(), image.getFileName());
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Product resolveProduct(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private void verifyProductOwnership(Product product, User user) {
        if (user.getRole() == UserRole.ADMIN) {
            return;
        }
        if (product.getSeller() == null || !product.getSeller().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not authorized to modify images for this product.");
        }
    }

    public ProductImageResponse toResponse(ProductImage image) {
        String imageUrl = "/api/v1/products/" + image.getProduct().getId() + "/images/" + image.getId() + "/content";
        return new ProductImageResponse(
                image.getId(),
                image.getProduct().getId(),
                image.getFileName(),
                image.getContentType(),
                image.getFileSize(),
                image.getIsPrimary(),
                image.getDisplayOrder(),
                imageUrl,
                image.getCreatedAt()
        );
    }

    public record ImageContentResult(Resource resource, String contentType, String fileName) {}
}
