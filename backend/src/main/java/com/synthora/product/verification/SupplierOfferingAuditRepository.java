package com.synthora.product.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupplierOfferingAuditRepository extends JpaRepository<SupplierOfferingAudit, UUID> {
    List<SupplierOfferingAudit> findByOfferingIdOrderByTimestampDesc(UUID offeringId);
}
