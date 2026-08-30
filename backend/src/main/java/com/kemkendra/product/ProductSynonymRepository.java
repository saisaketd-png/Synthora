package com.kemkendra.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductSynonymRepository extends JpaRepository<ProductSynonym, UUID> {

    List<ProductSynonym> findByMasterProductId(UUID masterProductId);

    List<ProductSynonym> findByMasterProductIdAndStatus(UUID masterProductId, SynonymStatus status);

    @Query("SELECT s FROM ProductSynonym s WHERE s.masterProduct.id = :masterProductId AND LOWER(TRIM(s.synonym)) = LOWER(TRIM(:synonym))")
    Optional<ProductSynonym> findByMasterProductIdAndSynonymNormalized(
            @Param("masterProductId") UUID masterProductId,
            @Param("synonym") String synonym);

    @Query("SELECT COUNT(s) > 0 FROM ProductSynonym s WHERE s.masterProduct.id = :masterProductId AND LOWER(TRIM(s.synonym)) = LOWER(TRIM(:synonym))")
    boolean existsByMasterProductIdAndSynonymNormalized(
            @Param("masterProductId") UUID masterProductId,
            @Param("synonym") String synonym);

    List<ProductSynonym> findByStatusOrderByCreatedAtDesc(SynonymStatus status);
}
