package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.ProductResponse;
import com.synthora.product.dto.UpdateProductRequest;
import com.synthora.product.dto.ProductSupplierResponse;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.synthora.product.dto.ProductDetailResponse;

import java.math.BigDecimal;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductSupplierRepository productSupplierRepository;

    public ProductService(ProductRepository productRepository,
                          UserRepository userRepository,
                          ProductSupplierRepository productSupplierRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.productSupplierRepository = productSupplierRepository;
    }

    public ProductResponse createProduct(CreateProductRequest request,
                                         Authentication authentication) {

        String email = authentication.getName();

        User seller = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = new Product();
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(request.category());
        product.setSeller(seller);

        Product saved = productRepository.save(product);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {

        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(UUID id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(UUID id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),

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
    public ProductResponse updateProduct(
            UUID id,
            UpdateProductRequest request,
            Authentication authentication) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

        boolean isOwner = product.getSeller().getId()
                .equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You cannot update this product");
        }

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(request.category());

        Product saved = productRepository.save(product);

        return toResponse(saved);
    }

    public void deleteProduct(UUID id, Authentication authentication) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        String email = authentication.getName();

        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");

        boolean isOwner = product.getSeller().getId()
                .equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("You cannot delete this product");
        }

        productRepository.delete(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(
            int page,
            int size,
            String sortField,
            String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortField).descending()
                : Sort.by(sortField).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return productRepository.findAll(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(
            String keyword,
            int page,
            int size,
            String sortField,
            String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortField).descending()
                : Sort.by(sortField).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return productRepository
                .findByNameContainingIgnoreCase(keyword, pageable)
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

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortField).descending()
                : Sort.by(sortField).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return productRepository
                .filterProducts(minPrice, maxPrice, inStock, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategory(
            ProductCategory category,
            int page,
            int size,
            String sortField,
            String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortField).descending()
                : Sort.by(sortField).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return productRepository.findByCategory(category, pageable)
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

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortField).descending()
                : Sort.by(sortField).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return productRepository.findBySellerId(currentUser.getId(), pageable)
                .map(this::toResponse);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),

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
    @Transactional(readOnly = true)
    public List<ProductSupplierResponse> getProductSuppliers(UUID productId) {

        return productSupplierRepository.findByProductId(productId)
                .stream()
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


}