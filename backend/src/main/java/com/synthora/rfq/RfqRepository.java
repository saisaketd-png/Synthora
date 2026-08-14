package com.synthora.rfq;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RfqRepository extends JpaRepository<Rfq, UUID> {

    List<Rfq> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);
}