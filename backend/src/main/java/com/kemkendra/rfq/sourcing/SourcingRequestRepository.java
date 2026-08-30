package com.kemkendra.rfq.sourcing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SourcingRequestRepository extends JpaRepository<SourcingRequest, UUID> {
    List<SourcingRequest> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);
    Optional<SourcingRequest> findByIdAndBuyerId(UUID id, UUID buyerId);
}
