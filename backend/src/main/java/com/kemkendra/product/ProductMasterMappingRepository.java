package com.kemkendra.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductMasterMappingRepository extends JpaRepository<ProductMasterMapping, UUID> {

    Optional<ProductMasterMapping> findByLegacyProductId(UUID legacyProductId);

    Optional<ProductMasterMapping> findByLegacyProductProductCode(String productCode);

    java.util.List<ProductMasterMapping> findByMasterProductId(UUID masterProductId);
}
