package com.synthora.buyer.shortlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuyerShortlistItemRepository extends JpaRepository<BuyerShortlistItem, UUID> {
    List<BuyerShortlistItem> findByShortlistId(UUID shortlistId);
    Optional<BuyerShortlistItem> findByShortlistIdAndSupplierOfferingId(UUID shortlistId, UUID supplierOfferingId);
    boolean existsByShortlistIdAndSupplierOfferingId(UUID shortlistId, UUID supplierOfferingId);
}
