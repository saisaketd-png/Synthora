package com.kemkendra.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MasterProductImageRepository extends JpaRepository<MasterProductImage, UUID> {

    List<MasterProductImage> findByMasterProductIdAndStatusOrderByDisplayOrderAsc(UUID masterProductId, String status);

    Optional<MasterProductImage> findByMasterProductIdAndIsPrimaryTrueAndStatus(UUID masterProductId, String status);

    long countByMasterProductIdAndStatus(UUID masterProductId, String status);
}
