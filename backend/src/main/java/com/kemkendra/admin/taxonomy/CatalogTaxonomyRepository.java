package com.kemkendra.admin.taxonomy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CatalogTaxonomyRepository extends JpaRepository<CatalogTaxonomy, UUID> {
    List<CatalogTaxonomy> findByTypeOrderByDisplayOrderAscNameAsc(String type);
    List<CatalogTaxonomy> findByTypeAndActiveTrueOrderByDisplayOrderAscNameAsc(String type);
    Optional<CatalogTaxonomy> findByTypeAndCode(String type, String code);
    boolean existsByTypeAndCode(String type, String code);
}
