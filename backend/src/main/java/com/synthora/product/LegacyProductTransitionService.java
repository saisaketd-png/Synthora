package com.synthora.product;

import com.synthora.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class LegacyProductTransitionService {

    private final MasterProductRepository masterProductRepository;
    private final ProductRepository productRepository;
    private final ProductMasterMappingRepository mappingRepository;

    public LegacyProductTransitionService(
            MasterProductRepository masterProductRepository,
            ProductRepository productRepository,
            ProductMasterMappingRepository mappingRepository) {
        this.masterProductRepository = masterProductRepository;
        this.productRepository = productRepository;
        this.mappingRepository = mappingRepository;
    }

    /**
     * Resolves any product identifier (MasterProduct Code, MasterProduct UUID,
     * Legacy Product Code, or Legacy Product UUID) to the canonical active MasterProduct.
     * If the resolved MasterProduct is in MERGED state, transparently resolves to the target MasterProduct.
     */
    public MasterProduct resolveCanonicalMasterProduct(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Product identifier must not be blank.");
        }

        String raw = identifier.trim();
        Optional<MasterProduct> target = Optional.empty();

        // 1. Check if UUID
        try {
            UUID uuid = UUID.fromString(raw);
            target = masterProductRepository.findById(uuid);
            if (target.isEmpty()) {
                // Try legacy product UUID lookup via mapping or product repository
                Optional<ProductMasterMapping> map = mappingRepository.findByLegacyProductId(uuid);
                if (map.isPresent()) {
                    target = Optional.of(map.get().getMasterProduct());
                } else {
                    // Fallback to legacy Product matching by CAS / Name
                    Optional<Product> leg = productRepository.findById(uuid);
                    if (leg.isPresent() && leg.get().getCasNumber() != null) {
                        target = masterProductRepository.findByCasNumber(leg.get().getCasNumber()).stream().findFirst();
                    }
                }
            }
        } catch (IllegalArgumentException ignored) {
            // Not a UUID string
        }

        // 2. Check MasterProduct Code (e.g. API-MP-100428)
        if (target.isEmpty()) {
            target = masterProductRepository.findByMasterProductCode(raw);
        }

        // 3. Check Legacy Product Code (e.g. API-100428)
        if (target.isEmpty()) {
            Optional<ProductMasterMapping> map = mappingRepository.findByLegacyProductProductCode(raw);
            if (map.isPresent()) {
                target = Optional.of(map.get().getMasterProduct());
            } else {
                Optional<Product> leg = productRepository.findByProductCode(raw);
                if (leg.isPresent() && leg.get().getCasNumber() != null) {
                    target = masterProductRepository.findByCasNumber(leg.get().getCasNumber()).stream().findFirst();
                }
            }
        }

        MasterProduct mp = target.orElseThrow(() ->
                new ResourceNotFoundException("No canonical MasterProduct found for identifier: " + raw));

        // 4. Follow MERGED redirect chain to active canonical target
        while ("MERGED".equalsIgnoreCase(mp.getStatus()) && mp.getMergedIntoMasterProduct() != null) {
            mp = mp.getMergedIntoMasterProduct();
        }

        return mp;
    }
}
