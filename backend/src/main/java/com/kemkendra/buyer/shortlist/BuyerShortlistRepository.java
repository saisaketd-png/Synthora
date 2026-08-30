package com.kemkendra.buyer.shortlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuyerShortlistRepository extends JpaRepository<BuyerShortlist, UUID> {
    Optional<BuyerShortlist> findByBuyerId(UUID buyerId);
}
