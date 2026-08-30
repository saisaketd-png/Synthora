package com.kemkendra.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MasterProductRepository extends JpaRepository<MasterProduct, UUID>, JpaSpecificationExecutor<MasterProduct> {

    Optional<MasterProduct> findByMasterProductCode(String masterProductCode);

    Optional<MasterProduct> findByMasterProductCodeIgnoreCase(String masterProductCode);

    boolean existsByMasterProductCode(String masterProductCode);

    List<MasterProduct> findByCasNumber(String casNumber);

    Optional<MasterProduct> findByCasNumberAndCategory(String casNumber, ProductCategory category);

    Page<MasterProduct> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<MasterProduct> findByStatus(String status, Pageable pageable);

    List<MasterProduct> findByStatus(String status);

    long countByStatus(String status);

    Page<MasterProduct> findByNameContainingIgnoreCaseAndStatus(String name, String status, Pageable pageable);

    Page<MasterProduct> findByCategory(ProductCategory category, Pageable pageable);

    long countByCategoryAndStatus(ProductCategory category, String status);

    @Query("SELECT DISTINCT mp FROM MasterProduct mp WHERE LOWER(mp.name) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(mp.casNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(REPLACE(REPLACE(mp.casNumber, '-', ''), ' ', '')) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(mp.masterProductCode) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(mp.molecularFormula) LIKE LOWER(CONCAT('%', :term, '%')) OR EXISTS (SELECT s FROM ProductSynonym s WHERE s.masterProduct = mp AND s.status = com.kemkendra.product.SynonymStatus.APPROVED AND LOWER(s.synonym) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<MasterProduct> searchByTerm(@Param("term") String term, Pageable pageable);

    @Query("SELECT DISTINCT mp FROM MasterProduct mp WHERE mp.status = 'ACTIVE' AND (LOWER(mp.name) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(mp.casNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(REPLACE(REPLACE(mp.casNumber, '-', ''), ' ', '')) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(mp.masterProductCode) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(mp.molecularFormula) LIKE LOWER(CONCAT('%', :term, '%')) OR EXISTS (SELECT s FROM ProductSynonym s WHERE s.masterProduct = mp AND s.status = com.kemkendra.product.SynonymStatus.APPROVED AND LOWER(s.synonym) LIKE LOWER(CONCAT('%', :term, '%'))))")
    Page<MasterProduct> searchActiveByTerm(@Param("term") String term, Pageable pageable);
}
