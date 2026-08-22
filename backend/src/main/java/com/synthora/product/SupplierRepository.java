package com.synthora.product;

import com.synthora.identity.User;
import com.synthora.seller.SupplierVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long>, JpaSpecificationExecutor<Supplier> {

    Optional<Supplier> findByUser(User user);

    long countByVerificationStatus(SupplierVerificationStatus verificationStatus);

    long countByVerified(Boolean verified);

    Page<Supplier> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Supplier> findByVerificationStatus(SupplierVerificationStatus verificationStatus);
}