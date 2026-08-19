package com.synthora.product;

import com.synthora.product.dto.MasterProductSearchCriteria;
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

            // 1. Multi-Field Search (Name, CAS, Code, Formula, Description)
            if (criteria.query() != null && !criteria.query().isBlank()) {
                String rawQuery = criteria.query().trim();
                String lq = "%" + rawQuery.toLowerCase() + "%";
                String normalizedCasQuery = rawQuery.replaceAll("[^0-9]", "");

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

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            // 2. Category Filter
            if (criteria.category() != null) {
                predicates.add(cb.equal(root.get("category"), criteria.category()));
            }

            // 3. Mandatory Supplier Offering Join for Public Catalog (At least 1 APPROVED and AVAILABLE offering)
            Join<MasterProduct, SupplierOffering> offeringJoin = root.join("offerings", JoinType.INNER);

            predicates.add(cb.equal(cb.upper(offeringJoin.get("availabilityStatus")), "AVAILABLE"));
            predicates.add(cb.equal(cb.upper(offeringJoin.get("moderationStatus")), "APPROVED"));

            if (criteria.minPurity() != null) {
                predicates.add(cb.greaterThanOrEqualTo(offeringJoin.get("purity"), criteria.minPurity()));
            }
            if (criteria.maxPurity() != null) {
                predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("purity"), criteria.maxPurity()));
            }
            if (criteria.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("price"), criteria.maxPrice()));
                // Enforce currency boundary if price is filtered
                if (criteria.currency() != null) {
                    predicates.add(cb.equal(cb.upper(offeringJoin.get("currency")), criteria.currency().trim().toUpperCase()));
                }
            }
            if (criteria.minMoq() != null) {
                predicates.add(cb.greaterThanOrEqualTo(offeringJoin.get("moqKg"), criteria.minMoq()));
            }
            if (criteria.maxMoq() != null) {
                predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("moqKg"), criteria.maxMoq()));
            }
            if (criteria.maxLeadTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(offeringJoin.get("leadTimeDays"), criteria.maxLeadTime()));
            }
            if (criteria.minStock() != null) {
                predicates.add(cb.greaterThanOrEqualTo(offeringJoin.get("stock"), criteria.minStock()));
            }
            if (criteria.coaAvailable() != null && criteria.coaAvailable()) {
                predicates.add(cb.isTrue(offeringJoin.get("coaAvailable")));
            }
            if (criteria.msdsAvailable() != null && criteria.msdsAvailable()) {
                predicates.add(cb.isTrue(offeringJoin.get("msdsAvailable")));
            }
            if (criteria.exportReady() != null && criteria.exportReady()) {
                predicates.add(cb.isTrue(offeringJoin.get("exportReady")));
            }
            if (criteria.verifiedSupplier() != null && criteria.verifiedSupplier()) {
                // Supplier verified check
                Join<SupplierOffering, Supplier> supplierJoin = offeringJoin.join("supplier", JoinType.INNER);
                predicates.add(cb.isTrue(supplierJoin.get("verified")));
            }

            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
