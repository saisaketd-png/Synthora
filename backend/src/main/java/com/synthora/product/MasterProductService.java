package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.product.dto.AddSynonymPayload;
import com.synthora.product.dto.CreateMasterProductRequest;
import com.synthora.product.dto.MasterProductResponse;
import com.synthora.product.dto.MasterProductSearchCriteria;
import com.synthora.product.dto.ProductSynonymResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class MasterProductService {

    private final MasterProductRepository masterProductRepository;
    private final MasterProductCodeGenerator codeGenerator;
    private final ProductSynonymRepository productSynonymRepository;
    private final UserRepository userRepository;
    private final MasterProductImageRepository masterProductImageRepository;

    public MasterProductService(
            MasterProductRepository masterProductRepository,
            MasterProductCodeGenerator codeGenerator,
            ProductSynonymRepository productSynonymRepository,
            UserRepository userRepository,
            MasterProductImageRepository masterProductImageRepository) {
        this.masterProductRepository = masterProductRepository;
        this.codeGenerator = codeGenerator;
        this.productSynonymRepository = productSynonymRepository;
        this.userRepository = userRepository;
        this.masterProductImageRepository = masterProductImageRepository;
    }

    /**
     * Internal/Admin creation of canonical MasterProduct.
     */
    public MasterProductResponse createMasterProduct(CreateMasterProductRequest request) {
        if (request.casNumber() != null && !request.casNumber().isBlank()) {
            List<MasterProduct> existing = masterProductRepository.findByCasNumber(request.casNumber().trim());
            if (!existing.isEmpty()) {
                throw new IllegalArgumentException("MasterProduct with CAS " + request.casNumber() + " already exists.");
            }
        }

        String code = codeGenerator.generateMasterProductCode(request.category());
        MasterProduct mp = new MasterProduct();
        mp.setMasterProductCode(code);
        mp.setName(request.name());
        mp.setCasNumber(request.casNumber());
        mp.setMolecularFormula(request.molecularFormula());
        mp.setCategory(request.category());
        mp.setDescription(request.description());
        mp.setStatus("ACTIVE");
        MasterProduct saved = masterProductRepository.save(mp);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public MasterProductResponse getMasterProductById(UUID id) {
        MasterProduct mp = masterProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + id));
        return toResponse(mp);
    }

    @Transactional(readOnly = true)
    public MasterProductResponse getMasterProductByCode(String code) {
        MasterProduct mp = masterProductRepository.findByMasterProductCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found with code: " + code));
        return toResponse(mp);
    }

    @Transactional(readOnly = true)
    public List<MasterProductResponse> getMasterProductsByCas(String casNumber) {
        return masterProductRepository.findByCasNumber(casNumber).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Search with pagination and sorting.
     */
    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchMasterProducts(String query, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by("name").ascending());
        if (query == null || query.isBlank()) {
            return masterProductRepository.findByStatus("ACTIVE", pageable).map(this::toResponse);
        }
        return masterProductRepository.searchActiveByTerm(query.trim(), pageable).map(this::toResponse);
    }

    /**
     * Public search: only returns ACTIVE MasterProducts.
     */
    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchActiveMasterProducts(String query, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by("name").ascending());
        if (query == null || query.isBlank()) {
            return masterProductRepository.findByStatus("ACTIVE", pageable).map(this::toResponse);
        }
        return masterProductRepository.searchActiveByTerm(query.trim(), pageable).map(this::toResponse);
    }

    /**
     * Public search with multi-criteria filtering: category, CAS, purity, verified, etc.
     */
    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchActiveMasterProductsWithCriteria(com.synthora.product.dto.MasterProductSearchCriteria criteria) {
        Sort sort = Sort.by("name").ascending();
        if (criteria.sort() != null && !criteria.sort().isBlank()) {
            String s = criteria.sort().trim().toLowerCase();
            if (s.equals("createdat,desc") || s.equals("newest") || s.equals("recently_added") || s.equals("recent")) {
                sort = Sort.by("createdAt").descending();
            } else if (s.equals("createdat,asc") || s.equals("oldest")) {
                sort = Sort.by("createdAt").ascending();
            } else if (s.equals("name,desc") || s.equals("name_desc") || s.equals("z_a")) {
                sort = Sort.by("name").descending();
            } else if (s.equals("name,asc") || s.equals("name_asc") || s.equals("a_z") || s.equals("best_match")) {
                sort = Sort.by("name").ascending();
            }
        }
        int safePage = criteria.page() != null ? Math.max(0, criteria.page()) : 0;
        int safeSize = criteria.size() != null ? (criteria.size() <= 0 ? 20 : Math.min(criteria.size(), 100)) : 20;
        Pageable pageable = PageRequest.of(safePage, safeSize, sort);
        org.springframework.data.jpa.domain.Specification<MasterProduct> spec =
                MasterProductSpecification.createSpecification(criteria);
        return masterProductRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getCategoryCounts() {
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        for (ProductCategory category : ProductCategory.values()) {
            long count = masterProductRepository.countByCategoryAndStatus(category, "ACTIVE");
            counts.put(category.name(), count);
        }
        return counts;
    }

    /**
     * Public get active master product by ID or Code.
     */
    @Transactional(readOnly = true)
    public MasterProductResponse getActiveMasterProduct(String idOrCode) {
        MasterProduct mp;
        try {
            UUID id = UUID.fromString(idOrCode);
            mp = masterProductRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Active MasterProduct not found: " + idOrCode));
        } catch (IllegalArgumentException e) {
            mp = masterProductRepository.findByMasterProductCode(idOrCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Active MasterProduct not found: " + idOrCode));
        }

        if (!"ACTIVE".equalsIgnoreCase(mp.getStatus())) {
            throw new ResourceNotFoundException("Active MasterProduct not found: " + idOrCode);
        }

        return toResponse(mp);
    }

    // --- Product Synonym Management ---

    @Transactional(readOnly = true)
    public MasterProduct resolveMasterProduct(String idOrCode) {
        try {
            UUID id = UUID.fromString(idOrCode);
            return masterProductRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + idOrCode));
        } catch (IllegalArgumentException e) {
            return masterProductRepository.findByMasterProductCode(idOrCode)
                    .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + idOrCode));
        }
    }

    public ProductSynonymResponse addSynonym(UUID masterProductId, AddSynonymPayload payload, Authentication auth) {
        User adminUser = resolveAdmin(auth);
        MasterProduct mp = masterProductRepository.findById(masterProductId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + masterProductId));

        if (productSynonymRepository.existsByMasterProductIdAndSynonymNormalized(masterProductId, payload.synonym().trim())) {
            throw new IllegalArgumentException("Synonym '" + payload.synonym() + "' already exists for this master product.");
        }

        ProductSynonym synonym = new ProductSynonym(mp, payload.synonym().trim(), SynonymSource.OFFICIAL, adminUser);
        ProductSynonym saved = productSynonymRepository.save(synonym);
        return toSynonymResponse(saved);
    }

    public ProductSynonymResponse suggestSupplierSynonym(UUID masterProductId, AddSynonymPayload payload, Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Unauthenticated access denied.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User account not found: " + auth.getName()));

        MasterProduct mp = masterProductRepository.findById(masterProductId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found: " + masterProductId));

        if (productSynonymRepository.existsByMasterProductIdAndSynonymNormalized(masterProductId, payload.synonym().trim())) {
            throw new IllegalArgumentException("Synonym '" + payload.synonym() + "' already exists for this master product.");
        }

        SynonymSource source = user.getRole() == com.synthora.identity.UserRole.ADMIN ? SynonymSource.OFFICIAL : SynonymSource.SUPPLIER;
        SynonymStatus status = user.getRole() == com.synthora.identity.UserRole.ADMIN ? SynonymStatus.APPROVED : SynonymStatus.PENDING;

        ProductSynonym synonym = new ProductSynonym(mp, payload.synonym().trim(), source, user);
        synonym.setStatus(status);
        ProductSynonym saved = productSynonymRepository.save(synonym);
        return toSynonymResponse(saved);
    }

    public void removeSynonym(UUID masterProductId, UUID synonymId, Authentication auth) {
        resolveAdmin(auth);
        ProductSynonym synonym = productSynonymRepository.findById(synonymId)
                .orElseThrow(() -> new ResourceNotFoundException("Product synonym not found: " + synonymId));

        if (!synonym.getMasterProduct().getId().equals(masterProductId)) {
            throw new IllegalArgumentException("Synonym does not belong to MasterProduct: " + masterProductId);
        }

        productSynonymRepository.delete(synonym);
    }

    @Transactional(readOnly = true)
    public List<ProductSynonymResponse> getSynonyms(UUID masterProductId) {
        if (!masterProductRepository.existsById(masterProductId)) {
            throw new ResourceNotFoundException("MasterProduct not found: " + masterProductId);
        }
        return productSynonymRepository.findByMasterProductId(masterProductId).stream()
                .map(this::toSynonymResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductSynonymResponse> getApprovedSynonyms(UUID masterProductId) {
        if (!masterProductRepository.existsById(masterProductId)) {
            throw new ResourceNotFoundException("MasterProduct not found: " + masterProductId);
        }
        return productSynonymRepository.findByMasterProductIdAndStatus(masterProductId, SynonymStatus.APPROVED).stream()
                .map(this::toSynonymResponse)
                .toList();
    }

    private User resolveAdmin(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Unauthenticated access denied.");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User account not found for email: " + auth.getName()));
        if (user.getRole() != com.synthora.identity.UserRole.ADMIN) {
            throw new AccessDeniedException("Only ADMIN users can manage product synonyms.");
        }
        return user;
    }

    private ProductSynonymResponse toSynonymResponse(ProductSynonym s) {
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

    private MasterProductResponse toResponse(MasterProduct mp) {
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
