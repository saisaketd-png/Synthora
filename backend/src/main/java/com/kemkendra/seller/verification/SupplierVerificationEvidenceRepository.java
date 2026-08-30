package com.kemkendra.seller.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierVerificationEvidenceRepository extends JpaRepository<SupplierVerificationEvidence, UUID> {
    List<SupplierVerificationEvidence> findBySupplierId(Long supplierId);
    Optional<SupplierVerificationEvidence> findBySupplierIdAndVerificationType(Long supplierId, VerificationType verificationType);
    void deleteBySupplierId(Long supplierId);
}
