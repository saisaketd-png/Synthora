package com.synthora.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierOfferingRepository extends JpaRepository<SupplierOffering, UUID>, JpaSpecificationExecutor<SupplierOffering> {

    List<SupplierOffering> findByMasterProductId(UUID masterProductId);

    List<SupplierOffering> findBySupplierId(Long supplierId);

    Optional<SupplierOffering> findByMasterProductIdAndSupplierId(UUID masterProductId, Long supplierId);

    boolean existsByMasterProductIdAndSupplierId(UUID masterProductId, Long supplierId);

    Page<SupplierOffering> findBySupplierId(Long supplierId, Pageable pageable);

    long countBySupplierId(Long supplierId);

    long countByMasterProductIdAndAvailabilityStatusAndModerationStatus(UUID masterProductId, String availabilityStatus, String moderationStatus);

    long countByModerationStatus(String moderationStatus);

    List<SupplierOffering> findByModerationStatus(String moderationStatus);
}
