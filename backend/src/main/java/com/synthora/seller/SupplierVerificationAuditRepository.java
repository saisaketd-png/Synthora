package com.synthora.seller;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupplierVerificationAuditRepository extends JpaRepository<SupplierVerificationAudit, UUID> {
    List<SupplierVerificationAudit> findBySupplierIdOrderByTimestampDesc(Long supplierId);
}
