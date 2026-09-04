package com.kemkendra.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierOfferingRepository extends JpaRepository<SupplierOffering, UUID>, JpaSpecificationExecutor<SupplierOffering> {

    List<SupplierOffering> findByMasterProductId(UUID masterProductId);

    List<SupplierOffering> findBySupplierId(Long supplierId);

    Optional<SupplierOffering> findByMasterProductIdAndSupplierId(UUID masterProductId, Long supplierId);

    boolean existsByMasterProductIdAndSupplierId(UUID masterProductId, Long supplierId);

    Page<SupplierOffering> findBySupplierId(Long supplierId, Pageable pageable);

    /**
     * Fetches offerings with masterProduct eagerly loaded via JOIN FETCH.
     * Use for public-facing endpoints to prevent LazyInitializationException
     * when accessing MasterProduct fields outside a transaction/session.
     */
    @Query("SELECT so FROM SupplierOffering so JOIN FETCH so.masterProduct mp WHERE so.supplier.id = :supplierId")
    List<SupplierOffering> findBySupplierId_WithMasterProduct(@Param("supplierId") Long supplierId);

    long countBySupplierId(Long supplierId);

    long countBySupplierIdAndAvailabilityStatus(Long supplierId, String availabilityStatus);

    long countByMasterProductIdAndAvailabilityStatusAndModerationStatus(UUID masterProductId, String availabilityStatus, String moderationStatus);

    long countByModerationStatus(String moderationStatus);

    List<SupplierOffering> findByModerationStatus(String moderationStatus);
}
