package com.kemkendra.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID>, JpaSpecificationExecutor<PurchaseOrder> {

    Optional<PurchaseOrder> findByRfqId(UUID rfqId);

    boolean existsByRfqId(UUID rfqId);

    List<PurchaseOrder> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    Optional<PurchaseOrder> findByIdAndBuyerId(UUID id, UUID buyerId);

    List<PurchaseOrder> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);

    Optional<PurchaseOrder> findByIdAndSupplierId(UUID id, Long supplierId);

    @Query(value = "SELECT nextval('purchase_order_seq')", nativeQuery = true)
    Long getNextPoSequenceValue();
}
