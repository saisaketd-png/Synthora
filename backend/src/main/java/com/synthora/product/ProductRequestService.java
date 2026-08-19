package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationService;
import com.synthora.notification.NotificationType;
import com.synthora.product.dto.CreateProductRequestRequest;
import com.synthora.product.dto.ProductRequestResponse;
import com.synthora.seller.SupplierIdentityResolver;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ProductRequestService {

    private final ProductRequestRepository productRequestRepository;
    private final UserRepository userRepository;
    private final SupplierIdentityResolver identityResolver;
    private final NotificationService notificationService;

    public ProductRequestService(
            ProductRequestRepository productRequestRepository,
            UserRepository userRepository,
            SupplierIdentityResolver identityResolver,
            NotificationService notificationService) {
        this.productRequestRepository = productRequestRepository;
        this.userRepository = userRepository;
        this.identityResolver = identityResolver;
        this.notificationService = notificationService;
    }

    /**
     * Supplier creates a request for a new chemical compound not found in MasterCatalog.
     * Supplier identity is strictly resolved from JWT authentication.
     */
    public ProductRequestResponse createRequest(
            CreateProductRequestRequest request,
            Authentication authentication) {

        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        ProductRequest pr = new ProductRequest();
        pr.setSupplier(supplier);
        pr.setProposedName(request.proposedName().trim());
        pr.setCasNumber(request.casNumber() != null ? request.casNumber().trim() : null);
        pr.setMolecularFormula(request.molecularFormula() != null ? request.molecularFormula().trim() : null);
        pr.setCategory(request.category());
        pr.setDescription(request.description() != null ? request.description().trim() : null);
        pr.setSupplierMessage(request.supplierMessage() != null ? request.supplierMessage().trim() : null);
        pr.setStatus("PENDING_REVIEW");

        ProductRequest saved = productRequestRepository.save(pr);

        // Notify Admins
        notificationService.notifyAdmins(
                NotificationType.PRODUCT_REQUEST_SUBMITTED,
                "New Chemical Request Requires Review",
                "Supplier " + supplier.getName() + " requested a new chemical proposal: '" + pr.getProposedName() + "'.",
                NotificationEntityType.PRODUCT_REQUEST,
                saved.getId()
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductRequestResponse> getMyRequests(Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        return productRequestRepository.findBySupplierId(supplier.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductRequestResponse getRequestById(UUID requestId, Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        if (!pr.getSupplier().getId().equals(supplier.getId())) {
            throw new AccessDeniedException("You cannot view another supplier's request");
        }

        return toResponse(pr);
    }

    public ProductRequestResponse respondProductInformation(UUID requestId, com.synthora.product.dto.RespondProductInfoPayload payload, Authentication authentication) {
        User user = resolveUser(authentication);
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);

        ProductRequest pr = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest not found: " + requestId));

        if (!pr.getSupplier().getId().equals(supplier.getId())) {
            throw new AccessDeniedException("You cannot respond to another supplier's request");
        }

        pr.setStatus("PENDING_REVIEW");
        pr.setSupplierResponseNotes(payload.supplierResponseNotes().trim());
        if (payload.correctedName() != null && !payload.correctedName().isBlank()) pr.setProposedName(payload.correctedName().trim());
        if (payload.correctedCas() != null) pr.setCasNumber(payload.correctedCas().trim());
        if (payload.correctedFormula() != null) pr.setMolecularFormula(payload.correctedFormula().trim());

        ProductRequest saved = productRequestRepository.save(pr);

        // Notify Admins
        notificationService.notifyAdmins(
                NotificationType.PRODUCT_INFO_RESPONDED,
                "Product Request Information Received",
                "Supplier " + supplier.getName() + " responded to info request for '" + pr.getProposedName() + "'.",
                NotificationEntityType.PRODUCT_REQUEST,
                saved.getId()
        );

        return toResponse(saved);
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private ProductRequestResponse toResponse(ProductRequest pr) {
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
}
