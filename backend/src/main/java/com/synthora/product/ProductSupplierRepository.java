package com.synthora.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductSupplierRepository extends JpaRepository<ProductSupplier, Long> {

    List<ProductSupplier> findByProductId(UUID productId);
}