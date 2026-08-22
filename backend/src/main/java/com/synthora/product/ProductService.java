package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.document.DocumentCategory;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserStatus;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.ProductDetailResponse;
import com.synthora.product.dto.ProductImageResponse;
import com.synthora.product.dto.ProductResponse;
import com.synthora.product.dto.ProductSupplierResponse;
import com.synthora.product.dto.UpdateProductRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductSupplierRepository productSupplierRepository;
    private final ProductCodeGenerator productCodeGenerator;
    private final ProductImageRepository productImageRepository;
    private final MasterProductRepository masterProductRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;

    public ProductService(ProductRepository productRepository,
                          UserRepository userRepository,
                          ProductSupplierRepository productSupplierRepository,
                          ProductCodeGenerator productCodeGenerator,
                          ProductImageRepository productImageRepository,
                          MasterProductRepository masterProductRepository,
                          SupplierOfferingRepository supplierOfferingRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.productSupplierRepository = productSupplierRepository;
        this.productCodeGenerator = productCodeGenerator;
        this.productImageRepository = productImageRepository;
        this.masterProductRepository = masterProductRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
    }

    public ProductResponse createProduct(CreateProductRequest request,
                                         Authentication authentication) {

        String email = authentication.getName();

        User seller = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = new Product();
        product.setName(request.name());
        product.setProductCode(productCodeGenerator.generateProductCode(request.category()));
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(request.category());

        product.setCasNumber(request.casNumber());
        product.setMolecularFormula(request.molecularFormula());
        product.setPurity(request.purity());
        product.setGrade(request.grade());
        product.setMoqKg(request.moqKg());
        product.setPackaging(request.packaging());
        product.setLeadTimeDays(request.leadTimeDays());
        product.setCoaAvailable(request.coaAvailable() != null ? request.coaAvailable() : false);
        product.setMsdsAvailable(request.msdsAvailable() != null ? request.msdsAvailable() : false);
        product.setExportReady(request.exportReady() != null ? request.exportReady() : false);
        product.setAvailabilityStatus(request.availabilityStatus());

        product.setSeller(seller);

        Product saved = productRepository.save(product);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll(publicVisibilitySpec(), Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (isHiddenOrDiscontinued(product)) {
            throw new ResourceNotFoundException("Product not found");
        }

        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (isHiddenOrDiscontinued(product) || product.getSeller() == null ||
                product.getSeller().getStatus() == UserStatus.SUSPENDED ||
                product.getSeller().getDeletedAt() != null) {
            throw new ResourceNotFoundException("Product not found");
        }

        return toDetailResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetailByIdOrCode(String idOrCode) {
        if (idOrCode == null || idOrCode.isBlank()) {
            throw new ResourceNotFoundException("Product not found");
        }

        Product product = null;
        UUID uuid = null;
        try {
            uuid = UUID.fromString(idOrCode.trim());
            product = productRepository.findById(uuid).orElse(null);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, lookup by product code
        }

        if (product == null) {
            product = productRepository.findByProductCodeIgnoreCase(idOrCode.trim()).orElse(null);
        }

        if (product != null) {
            if (isHiddenOrDiscontinued(product) || product.getSeller() == null ||
                    product.getSeller().getStatus() == UserStatus.SUSPENDED ||
                    product.getSeller().getDeletedAt() != null) {
                throw new ResourceNotFoundException("Product not found");
            }
            return toDetailResponse(product);
        }

        // Check MasterProduct
        if (uuid != null) {
            var masterProductOpt = masterProductRepository.findById(uuid);
            if (masterProductOpt.isPresent()) {
                MasterProduct mp = masterProductOpt.get();
                return toMasterProductDetailResponse(mp);
            }

            var offeringOpt = supplierOfferingRepository.findById(uuid);
            if (offeringOpt.isPresent()) {
                SupplierOffering offering = offeringOpt.get();
                return toOfferingDetailResponse(offering);
            }
        } else {
            var masterProductOpt = masterProductRepository.findByMasterProductCodeIgnoreCase(idOrCode.trim());
            if (masterProductOpt.isPresent()) {
                MasterProduct mp = masterProductOpt.get();
                return toMasterProductDetailResponse(mp);
            }
        }

        throw new ResourceNotFoundException("Product not found");
    }

    private ProductDetailResponse toMasterProductDetailResponse(MasterProduct mp) {
        return new ProductDetailResponse(
                mp.getId(),
                mp.getMasterProductCode(),
                mp.getName(),
                mp.getDescription(),
                mp.getCategory(),
                null,
                List.of(),
                mp.getCasNumber(),
                mp.getMolecularFormula(),
                new BigDecimal("99.0"),
                "IP / BP / USP Standard",
                null,
                null,
                new BigDecimal("100.00"),
                "Standard Industrial Drums / Packaging",
                14,
                "AVAILABLE",
                true,
                true,
                true,
                null,
                "Synthora Verified Master Catalog",
                mp.getCreatedAt(),
                mp.getUpdatedAt()
        );
    }

    private ProductDetailResponse toOfferingDetailResponse(SupplierOffering offering) {
        MasterProduct mp = offering.getMasterProduct();
        String name = mp != null ? mp.getName() : "Specialty Chemical Raw Material";
        String cas = mp != null ? mp.getCasNumber() : null;
        String formula = mp != null ? mp.getMolecularFormula() : null;
        ProductCategory cat = mp != null ? mp.getCategory() : ProductCategory.SPECIALTY_CHEMICAL;
        String sellerName = offering.getSupplier() != null ? offering.getSupplier().getName() : "Verified Supplier";
        UUID sellerId = (offering.getSupplier() != null && offering.getSupplier().getUser() != null) ? offering.getSupplier().getUser().getId() : null;

        return new ProductDetailResponse(
                offering.getId(),
                mp != null ? mp.getMasterProductCode() : "OFFERING",
                name,
                mp != null ? mp.getDescription() : null,
                cat,
                null,
                List.of(),
                cas,
                formula,
                offering.getPurity(),
                offering.getGrade(),
                offering.getPrice(),
                offering.getStock(),
                offering.getMoqKg(),
                offering.getPackaging() != null ? offering.getPackaging() : "Standard Drum Container",
                offering.getLeadTimeDays(),
                offering.getAvailabilityStatus(),
                offering.getCoaAvailable(),
                offering.getMsdsAvailable(),
                offering.getExportReady(),
                sellerId,
                sellerName,
                offering.getCreatedAt(),
                offering.getUpdatedAt()
        );
    }

    private ProductDetailResponse toDetailResponse(Product product) {
        List<ProductImageResponse> imageResponses = productImageRepository.findByProductIdOrderByDisplayOrderAsc(product.getId())
                .stream()
                .map(img -> new ProductImageResponse(
                        img.getId(),
                        product.getId(),
                        img.getFileName(),
                        img.getContentType(),
                        img.getFileSize(),
                        img.getIsPrimary(),
                        img.getDisplayOrder(),
                        "/api/v1/products/" + product.getId() + "/images/" + img.getId() + "/content",
                        img.getCreatedAt()
                ))
                .toList();

        String primaryImageUrl = imageResponses.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .map(ProductImageResponse::imageUrl)
                .findFirst()
                .orElse(!imageResponses.isEmpty() ? imageResponses.get(0).imageUrl() : null);

        return new ProductDetailResponse(
                product.getId(),
                product.getProductCode(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                primaryImageUrl,
                imageResponses,

                product.getCasNumber(),
                product.getMolecularFormula(),
                product.getPurity(),
                product.getGrade(),

                product.getPrice(),
                product.getStock(),
                product.getMoqKg(),
                product.getPackaging(),
                product.getLeadTimeDays(),
                product.getAvailabilityStatus(),

                product.getCoaAvailable(),
                product.getMsdsAvailable(),
                product.getExportReady(),

                product.getSeller().getId(),
                product.getSeller().getName(),

                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<ProductSupplierResponse> getProductSuppliers(UUID productId) {
        return productSupplierRepository.findByProductId(productId)
                .stream()
                .filter(ps -> ps.getSupplier() != null &&
                        (ps.getSupplier().getUser() == null ||
                        (ps.getSupplier().getUser().getStatus() != UserStatus.SUSPENDED &&
                         ps.getSupplier().getUser().getDeletedAt() == null)))
                .map(ps -> new ProductSupplierResponse(
                        ps.getSupplier().getId(),
                        ps.getSupplier().getName(),
                        ps.getSupplier().getCountryName(),
                        ps.getSupplier().getVerified(),
                        ps.getSupplier().getYearsInBusiness(),
                        ps.getSupplier().getResponseRate(),
                        ps.getSupplier().getExportReady(),
                        ps.getPurity(),
                        ps.getGrade(),
                        ps.getMoqKg(),
                        ps.getPackaging(),
                        ps.getLeadTimeDays(),
                        ps.getCoaAvailable(),
                        ps.getMsdsAvailable()
                ))
                .toList();
    }

    @Transactional
    public ProductResponse updateProduct(UUID id,
                                         UpdateProductRequest request,
                                         Authentication authentication) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        boolean isOwner = product.getSeller().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You cannot update this product");
        }

        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.stock() != null) product.setStock(request.stock());
        if (request.category() != null) product.setCategory(request.category());
        if (request.casNumber() != null) product.setCasNumber(request.casNumber());
        if (request.molecularFormula() != null) product.setMolecularFormula(request.molecularFormula());
        if (request.purity() != null) product.setPurity(request.purity());
        if (request.grade() != null) product.setGrade(request.grade());
        if (request.packaging() != null) product.setPackaging(request.packaging());
        if (request.moqKg() != null) product.setMoqKg(request.moqKg());
        if (request.leadTimeDays() != null) product.setLeadTimeDays(request.leadTimeDays());
        if (request.coaAvailable() != null) product.setCoaAvailable(request.coaAvailable());
        if (request.msdsAvailable() != null) product.setMsdsAvailable(request.msdsAvailable());
        if (request.exportReady() != null) product.setExportReady(request.exportReady());
        if (request.availabilityStatus() != null) product.setAvailabilityStatus(request.availabilityStatus());

        Product updated = productRepository.save(product);

        return toResponse(updated);
    }

    @Transactional
    public void deleteProduct(UUID id, Authentication authentication) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        boolean isOwner = product.getSeller().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You cannot delete this product");
        }

        productRepository.delete(product);
    }

    private static final java.util.Set<String> ALLOWED_PRODUCT_SORT_FIELDS = java.util.Set.of(
            "name", "price", "stock", "createdAt", "updatedAt", "category", "leadTimeDays", "purity", "moqKg", "productCode"
    );

    private Pageable createBoundedPageable(int page, int size, String sortField, String sortDir) {
        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);

        String cleanSortField = (sortField != null && ALLOWED_PRODUCT_SORT_FIELDS.contains(sortField.trim()))
                ? sortField.trim()
                : "createdAt";

        Sort.Direction direction = (sortDir != null && sortDir.equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(boundedPage, boundedSize, Sort.by(direction, cleanSortField).and(Sort.by(Sort.Direction.DESC, "id")));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchCatalogProducts(
            String search,
            List<ProductCategory> categories,
            String casNumber,
            BigDecimal purityMin,
            BigDecimal purityMax,
            BigDecimal moqMin,
            BigDecimal moqMax,
            Boolean inStock,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            String availabilityStatus,
            int page,
            int size,
            String sortField,
            String sortDir
    ) {
        Pageable pageable = createBoundedPageable(page, size, sortField, sortDir);
        Specification<Product> spec = ProductSpecification.buildCatalogSpec(
                search, categories, casNumber, purityMin, purityMax, moqMin, moqMax,
                inStock, coaAvailable, msdsAvailable, exportReady, availabilityStatus
        );
        return productRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(
            int page,
            int size,
            String sortField,
            String sortDir) {

        Pageable pageable = createBoundedPageable(page, size, sortField, sortDir);

        return productRepository.findAll(publicVisibilitySpec(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(
            String keyword,
            int page,
            int size,
            String sortField,
            String sortDir) {

        Pageable pageable = createBoundedPageable(page, size, sortField, sortDir);

        if (keyword == null || keyword.isBlank()) {
            return productRepository.findAll(publicVisibilitySpec(), pageable)
                    .map(this::toResponse);
        }

        String safeKeyword = keyword.trim();
        if (safeKeyword.length() > 100) {
            safeKeyword = safeKeyword.substring(0, 100);
        }

        final String searchPattern = "%" + safeKeyword.toLowerCase() + "%";
        Specification<Product> spec = publicVisibilitySpec().and((root, cq, cb) ->
                cb.like(cb.lower(root.get("name")), searchPattern)
        );

        return productRepository.findAll(spec, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> filterProducts(
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            int page,
            int size,
            String sortField,
            String sortDir) {

        Pageable pageable = createBoundedPageable(page, size, sortField, sortDir);

        Specification<Product> spec = publicVisibilitySpec().and((root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (minPrice != null) predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            if (maxPrice != null) predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            if (inStock != null && inStock) predicates.add(cb.greaterThan(root.get("stock"), 0));
            return cb.and(predicates.toArray(new Predicate[0]));
        });

        return productRepository.findAll(spec, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategory(
            ProductCategory category,
            int page,
            int size,
            String sortField,
            String sortDir) {

        Pageable pageable = createBoundedPageable(page, size, sortField, sortDir);

        Specification<Product> spec = publicVisibilitySpec().and((root, cq, cb) ->
                cb.equal(root.get("category"), category)
        );

        return productRepository.findAll(spec, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getMyProducts(
            Authentication authentication,
            int page,
            int size,
            String sortField,
            String sortDir) {

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Pageable pageable = createBoundedPageable(page, size, sortField, sortDir);

        return productRepository.findBySellerId(currentUser.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public void updateDocumentAvailability(UUID productId, DocumentCategory category, boolean isAvailable) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (category == DocumentCategory.COA) {
            product.setCoaAvailable(isAvailable);
            productRepository.save(product);
        } else if (category == DocumentCategory.MSDS) {
            product.setMsdsAvailable(isAvailable);
            productRepository.save(product);
        }
    }

    private Specification<Product> publicVisibilitySpec() {
        return (root, cq, cb) -> cb.or(
                cb.isNull(root.get("availabilityStatus")),
                cb.and(
                        cb.notEqual(cb.upper(root.get("availabilityStatus")), "HIDDEN"),
                        cb.notEqual(cb.upper(root.get("availabilityStatus")), "DISCONTINUED")
                )
        );
    }

    private boolean isHiddenOrDiscontinued(Product product) {
        if (product.getAvailabilityStatus() == null) return false;
        String status = product.getAvailabilityStatus().trim().toUpperCase();
        return "HIDDEN".equals(status) || "DISCONTINUED".equals(status);
    }

    private ProductResponse toResponse(Product product) {
        String primaryImageUrl = productImageRepository.findByProductIdAndIsPrimaryTrue(product.getId())
                .map(img -> "/api/v1/products/" + product.getId() + "/images/" + img.getId() + "/content")
                .orElse(null);

        return new ProductResponse(
                product.getId(),
                product.getProductCode(),
                product.getName(),
                product.getDescription(),
                primaryImageUrl,

                // Commercial
                product.getPrice(),
                product.getStock(),
                product.getCategory(),

                // Enterprise technical fields
                product.getCasNumber(),
                product.getMolecularFormula(),
                product.getPurity(),
                product.getGrade(),
                product.getPackaging(),
                product.getMoqKg(),
                product.getLeadTimeDays(),

                // Documentation & export
                product.getCoaAvailable(),
                product.getMsdsAvailable(),
                product.getExportReady(),
                product.getAvailabilityStatus(),

                // Audit
                product.getCreatedAt(),
                product.getUpdatedAt(),

                // Supplier
                product.getSeller().getId(),
                product.getSeller().getName()
        );
    }
}