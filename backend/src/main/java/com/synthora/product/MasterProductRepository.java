package com.synthora.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MasterProductRepository extends JpaRepository<MasterProduct, UUID>, JpaSpecificationExecutor<MasterProduct> {

    Optional<MasterProduct> findByMasterProductCode(String masterProductCode);

    Optional<MasterProduct> findByMasterProductCodeIgnoreCase(String masterProductCode);

    boolean existsByMasterProductCode(String masterProductCode);

    List<MasterProduct> findByCasNumber(String casNumber);

    Optional<MasterProduct> findByCasNumberAndCategory(String casNumber, ProductCategory category);

    Page<MasterProduct> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<MasterProduct> findByStatus(String status, Pageable pageable);

    List<MasterProduct> findByStatus(String status);

    long countByStatus(String status);

    Page<MasterProduct> findByNameContainingIgnoreCaseAndStatus(String name, String status, Pageable pageable);

    Page<MasterProduct> findByCategory(ProductCategory category, Pageable pageable);
}
