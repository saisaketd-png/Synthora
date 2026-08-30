package com.kemkendra.product;

import com.kemkendra.product.dto.MasterProductSearchCriteria;
import com.kemkendra.seller.SupplierVerificationStatus;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class MasterProductSpecification {

    public static Specification<MasterProduct> createSpecification(MasterProductSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always restrict public search to ACTIVE MasterProducts
            predicates.add(cb.equal(cb.upper(root.get("status")), "ACTIVE"));

            // 1. Multi-Field Search (Name, CAS, Code, Formula, Description, Synonyms)
            if (criteria.query() != null && !criteria.query().isBlank()) {
                String rawQuery = criteria.query().trim();
                String lq = "%" + rawQuery.toLowerCase() + "%";

                List<Predicate> searchPredicates = new ArrayList<>();

                // Match Name
                searchPredicates.add(cb.like(cb.lower(root.get("name")), lq));

                // Match Code
                searchPredicates.add(cb.like(cb.lower(root.get("masterProductCode")), lq));

                // Match CAS Number (Raw & Normalized)
                searchPredicates.add(cb.like(cb.lower(root.get("casNumber")), lq));
                if (rawQuery.matches("^[0-9\\-\\s]+$") && rawQuery.replaceAll("[^0-9]", "").length() >= 3) {
                    Expression<String> strippedCas = cb.function("REPLACE", String.class,
                            cb.function("REPLACE", String.class, root.get("casNumber"), cb.literal("-"), cb.literal("")),
                            cb.literal(" "), cb.literal(""));
                    searchPredicates.add(cb.like(strippedCas, "%" + rawQuery.replaceAll("[^0-9]", "") + "%"));
                }

                // Match Molecular Formula
                searchPredicates.add(cb.like(cb.lower(root.get("molecularFormula")), lq));

                // Match Description
                searchPredicates.add(cb.like(cb.lower(root.get("description")), lq));

                // Match Synonyms (Approved)
                Join<MasterProduct, ProductSynonym> synonymJoin = root.join("synonyms", JoinType.LEFT);
                searchPredicates.add(cb.and(
                        cb.equal(synonymJoin.get("status"), SynonymStatus.APPROVED),
                        cb.like(cb.lower(synonymJoin.get("synonym")), lq)
                ));

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            // 2. Category Filter
            if (criteria.category() != null) {
                predicates.add(cb.equal(root.get("category"), criteria.category()));
            }

            // 3. Mandatory Supplier Offering Join for Public Catalog (4 Pillars)
            if (Boolean.TRUE.equals(criteria.requireActiveOfferings())) {
                Join<MasterProduct, SupplierOffering> offeringJoin = root.join("offerings", JoinType.INNER);

                String targetAvailability = criteria.availabilityStatus() != null && !criteria.availabilityStatus().isBlank()
                        ? criteria.availabilityStatus().trim().toUpperCase()
                        : "AVAILABLE";
                predicates.add(cb.equal(cb.upper(offeringJoin.get("availabilityStatus")), targetAvailability));
                predicates.add(cb.equal(cb.upper(offeringJoin.get("moderationStatus")), "APPROVED"));

                // Supplier verified check (4-Pillar requirement)
                Join<SupplierOffering, Supplier> supplierJoin = offeringJoin.join("supplier", JoinType.INNER);
                predicates.add(cb.isTrue(supplierJoin.get("verified")));
                predicates.add(cb.notEqual(supplierJoin.get("verificationStatus"), SupplierVerificationStatus.SUSPENDED));
                predicates.add(cb.notEqual(supplierJoin.get("verificationStatus"), SupplierVerificationStatus.REJECTED));

                // Minimum & Maximum Purity
                if (criteria.minPurity() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(offeringJoin.get("purity"), criteria.minPurity()));
                }
                if (criteria.maxPurity() != null) {
                    predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("purity"), criteria.maxPurity()));
                }

                // Grade Filter
                if (criteria.grade() != null && !criteria.grade().isBlank()) {
                    predicates.add(cb.like(cb.lower(offeringJoin.get("grade")), "%" + criteria.grade().trim().toLowerCase() + "%"));
                }

                // Price & Currency Filter
                if (criteria.maxPrice() != null && criteria.maxPrice().compareTo(BigDecimal.ZERO) > 0) {
                    predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("price"), criteria.maxPrice()));
                    if (criteria.currency() != null && !criteria.currency().isBlank()) {
                        predicates.add(cb.equal(cb.upper(offeringJoin.get("currency")), criteria.currency().trim().toUpperCase()));
                    }
                }

                // Minimum & Maximum MOQ
                if (criteria.minMoq() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(offeringJoin.get("moqKg"), criteria.minMoq()));
                }
                if (criteria.maxMoq() != null) {
                    predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("moqKg"), criteria.maxMoq()));
                }

                // Lead Time
                if (criteria.maxLeadTime() != null) {
                    predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("leadTimeDays"), criteria.maxLeadTime()));
                }

                // Stock Filter
                if (criteria.minStock() != null && criteria.minStock() > 0) {
                    predicates.add(cb.greaterThanOrEqualTo(offeringJoin.get("stock"), criteria.minStock()));
                }

                // Compliance & Documentation
                if (Boolean.TRUE.equals(criteria.coaAvailable())) {
                    predicates.add(cb.isTrue(offeringJoin.get("coaAvailable")));
                }
                if (Boolean.TRUE.equals(criteria.msdsAvailable())) {
                    predicates.add(cb.isTrue(offeringJoin.get("msdsAvailable")));
                }
                if (Boolean.TRUE.equals(criteria.exportReady())) {
                    predicates.add(cb.isTrue(offeringJoin.get("exportReady")));
                }
            }

            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
