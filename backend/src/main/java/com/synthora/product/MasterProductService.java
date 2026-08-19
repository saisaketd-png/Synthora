package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.product.dto.CreateMasterProductRequest;
import com.synthora.product.dto.MasterProductResponse;
import com.synthora.product.dto.MasterProductSearchCriteria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    public MasterProductService(
            MasterProductRepository masterProductRepository,
            MasterProductCodeGenerator codeGenerator) {
        this.masterProductRepository = masterProductRepository;
        this.codeGenerator = codeGenerator;
    }

    /**
     * Internal/Admin creation of canonical MasterProduct.
     */
    public MasterProductResponse createMasterProduct(CreateMasterProductRequest request) {
        String cleanCas = request.casNumber() != null ? request.casNumber().trim() : null;

        // Basic duplicate check by CAS & category if CAS is present
        if (cleanCas != null && !cleanCas.isBlank()) {
            Optional<MasterProduct> existing = masterProductRepository.findByCasNumberAndCategory(cleanCas, request.category());
            if (existing.isPresent()) {
                throw new IllegalStateException("A MasterProduct already exists for CAS " + cleanCas + " in category " + request.category());
            }
        }

        MasterProduct mp = new MasterProduct();
        mp.setName(request.name().trim());
        mp.setMasterProductCode(codeGenerator.generateMasterProductCode(request.category()));
        mp.setCasNumber(cleanCas);
        mp.setMolecularFormula(request.molecularFormula() != null ? request.molecularFormula().trim() : null);
        mp.setCategory(request.category());
        mp.setDescription(request.description() != null ? request.description().trim() : null);
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
        MasterProduct mp = masterProductRepository.findByMasterProductCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("MasterProduct not found for code: " + code));
        return toResponse(mp);
    }

    @Transactional(readOnly = true)
    public List<MasterProductResponse> getMasterProductsByCas(String casNumber) {
        return masterProductRepository.findByCasNumber(casNumber.trim())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchMasterProducts(String query, int page, int size) {
        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(
                query, null, null, null, null, null, null, null, null, null, null, null, null, null, null, boundedPage, boundedSize, "createdAt,desc"
        );
        org.springframework.data.jpa.domain.Specification<MasterProduct> spec = MasterProductSpecification.createSpecification(criteria);
        return masterProductRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchActiveMasterProducts(String query, int page, int size) {
        MasterProductSearchCriteria criteria = new MasterProductSearchCriteria(
                query, null, null, null, "INR", null, null, null, null, null, null, null, null, null, null, page, size, "createdAt,desc"
        );
        return searchActiveMasterProductsWithCriteria(criteria);
    }

    @Transactional(readOnly = true)
    public Page<MasterProductResponse> searchActiveMasterProductsWithCriteria(com.synthora.product.dto.MasterProductSearchCriteria criteria) {
        int boundedPage = Math.max(0, criteria.page() != null ? criteria.page() : 0);
        int boundedSize = Math.min(Math.max(1, criteria.size() != null ? criteria.size() : 20), 100);

        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if (criteria.sort() != null && !criteria.sort().isBlank()) {
            String[] parts = criteria.sort().split(",");
            String prop = parts[0].trim();
            Sort.Direction dir = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) ? Sort.Direction.ASC : Sort.Direction.DESC;
            if ("name".equalsIgnoreCase(prop) || "masterProductCode".equalsIgnoreCase(prop) || "createdAt".equalsIgnoreCase(prop)) {
                sort = Sort.by(dir, prop);
            }
        }

        Pageable pageable = PageRequest.of(boundedPage, boundedSize, sort);
        org.springframework.data.jpa.domain.Specification<MasterProduct> spec = MasterProductSpecification.createSpecification(criteria);
        return masterProductRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private MasterProductResponse toResponse(MasterProduct mp) {
        int count = mp.getOfferings() != null ? mp.getOfferings().size() : 0;
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
                mp.getCreatedAt(),
                mp.getUpdatedAt()
        );
    }
}
