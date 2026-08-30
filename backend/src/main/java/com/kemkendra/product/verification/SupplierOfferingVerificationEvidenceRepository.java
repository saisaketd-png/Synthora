package com.kemkendra.product.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierOfferingVerificationEvidenceRepository extends JpaRepository<SupplierOfferingVerificationEvidence, UUID> {
    List<SupplierOfferingVerificationEvidence> findByOfferingId(UUID offeringId);
    Optional<SupplierOfferingVerificationEvidence> findByOfferingIdAndVerificationType(UUID offeringId, OfferingVerificationType verificationType);
    void deleteByOfferingId(UUID offeringId);
}
