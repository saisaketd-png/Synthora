package com.kemkendra.rfq;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RfqRepository extends JpaRepository<Rfq, UUID>, JpaSpecificationExecutor<Rfq> {

    List<Rfq> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    Optional<Rfq> findByIdAndBuyerId(UUID id, UUID buyerId);
    List<Rfq> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);
    List<Rfq> findBySupplierId(Long supplierId);
    List<Rfq> findBySupplierIdIn(List<Long> supplierIds);
    Optional<Rfq> findByIdAndSupplierId(UUID id, Long supplierId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Rfq r WHERE r.id = :id AND r.supplierId = :supplierId")
    Optional<Rfq> findByIdAndSupplierIdForUpdate(@org.springframework.data.repository.query.Param("id") UUID id, @org.springframework.data.repository.query.Param("supplierId") Long supplierId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT r FROM Rfq r WHERE r.id = :id AND r.buyerId = :buyerId")
    Optional<Rfq> findByIdAndBuyerIdForUpdate(@org.springframework.data.repository.query.Param("id") UUID id, @org.springframework.data.repository.query.Param("buyerId") UUID buyerId);
}