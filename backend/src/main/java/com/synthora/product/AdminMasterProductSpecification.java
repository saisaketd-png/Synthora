package com.synthora.product;

import com.synthora.product.dto.AdminMasterProductSearchCriteria;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class AdminMasterProductSpecification {

    public static Specification<MasterProduct> createSpecification(AdminMasterProductSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Status Filter (Default to non-MERGED or specific status)
            if (criteria.status() != null && !criteria.status().isBlank() && !"ALL".equalsIgnoreCase(criteria.status())) {
                predicates.add(cb.equal(cb.upper(root.get("status")), criteria.status().trim().toUpperCase()));
            }

            // 2. Multi-Field Search (Name, CAS, Code, Formula, Description)
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

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            // 3. Direct CAS Search parameter
            if (criteria.casNumber() != null && !criteria.casNumber().isBlank()) {
                String rawCas = criteria.casNumber().trim();
                String lqCas = "%" + rawCas.toLowerCase() + "%";

                if (rawCas.matches("^[0-9\\-\\s]+$") && rawCas.replaceAll("[^0-9]", "").length() >= 3) {
                    Expression<String> strippedCas = cb.function("REPLACE", String.class,
                            cb.function("REPLACE", String.class, root.get("casNumber"), cb.literal("-"), cb.literal("")),
                            cb.literal(" "), cb.literal(""));
                    predicates.add(cb.like(strippedCas, "%" + rawCas.replaceAll("[^0-9]", "") + "%"));
                } else {
                    predicates.add(cb.like(cb.lower(root.get("casNumber")), lqCas));
                }
            }

            // 4. Direct Master Product Code Search
            if (criteria.masterProductCode() != null && !criteria.masterProductCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("masterProductCode")), "%" + criteria.masterProductCode().trim().toLowerCase() + "%"));
            }

            // 5. Category Filter
            if (criteria.category() != null) {
                predicates.add(cb.equal(root.get("category"), criteria.category()));
            }

            // 6. Supplier Join Filters
            boolean needsOfferingJoin = criteria.supplierId() != null || (criteria.supplierVerified() != null && criteria.supplierVerified());

            if (needsOfferingJoin) {
                Join<MasterProduct, SupplierOffering> offeringJoin = root.join("offerings", JoinType.INNER);
                Join<SupplierOffering, Supplier> supplierJoin = offeringJoin.join("supplier", JoinType.INNER);

                if (criteria.supplierId() != null) {
                    predicates.add(cb.equal(supplierJoin.get("id"), criteria.supplierId()));
                }

                if (criteria.supplierVerified() != null && criteria.supplierVerified()) {
                    predicates.add(cb.isTrue(supplierJoin.get("verified")));
                }

                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
