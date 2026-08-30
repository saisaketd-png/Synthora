package com.kemkendra.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductSupplierRepository extends JpaRepository<ProductSupplier, Long> {

    List<ProductSupplier> findByProductId(UUID productId);

    Optional<ProductSupplier> findByProductIdAndSupplierId(UUID productId, Long supplierId);

    boolean existsByProductIdAndSupplierId(UUID productId, Long supplierId);

    List<ProductSupplier> findBySupplierId(Long supplierId);
}
