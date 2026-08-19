package com.synthora.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductRequestRepository extends JpaRepository<ProductRequest, UUID> {

    List<ProductRequest> findBySupplierId(Long supplierId);

    Page<ProductRequest> findBySupplierId(Long supplierId, Pageable pageable);

    Page<ProductRequest> findByStatus(String status, Pageable pageable);

    long countByStatus(String status);
}
