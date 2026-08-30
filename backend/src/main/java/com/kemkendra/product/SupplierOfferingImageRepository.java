package com.kemkendra.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierOfferingImageRepository extends JpaRepository<SupplierOfferingImage, UUID> {

    List<SupplierOfferingImage> findBySupplierOfferingIdAndStatusOrderByDisplayOrderAsc(UUID supplierOfferingId, String status);

    Optional<SupplierOfferingImage> findBySupplierOfferingIdAndIsPrimaryTrueAndStatus(UUID supplierOfferingId, String status);

    long countBySupplierOfferingIdAndStatus(UUID supplierOfferingId, String status);
}
