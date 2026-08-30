package com.kemkendra.product;

import com.kemkendra.identity.UserStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    /**
     * Base specification enforcing that only public, active products are returned:
     * - availabilityStatus is NOT 'HIDDEN' and NOT 'DISCONTINUED'
     * - Seller user is NOT suspended and NOT soft-deleted
     */
    public static Specification<Product> publicVisibility() {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Product availability status check
            Predicate statusNull = cb.isNull(root.get("availabilityStatus"));
            Predicate statusNotHidden = cb.notEqual(cb.upper(root.get("availabilityStatus")), "HIDDEN");
            Predicate statusNotDiscontinued = cb.notEqual(cb.upper(root.get("availabilityStatus")), "DISCONTINUED");
            predicates.add(cb.or(statusNull, cb.and(statusNotHidden, statusNotDiscontinued)));

            // 2. Seller status check
            var sellerJoin = root.join("seller");
            predicates.add(cb.notEqual(sellerJoin.get("status"), UserStatus.SUSPENDED));
            predicates.add(cb.isNull(sellerJoin.get("deletedAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Unified catalog filter specification combining search keyword, category,
     * CAS number, technical parameters, and documentation availability using strict AND semantics.
     */
    public static Specification<Product> buildCatalogSpec(
            String keyword,
            List<ProductCategory> categories,
            String casNumber,
            BigDecimal purityMin,
            BigDecimal purityMax,
            BigDecimal moqMin,
            BigDecimal moqMax,
            Boolean inStock,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            String availabilityStatus
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always enforce public visibility
            predicates.add(publicVisibility().toPredicate(root, query, cb));

            // 1. Keyword search (Name, ProductCode, CAS Number, Molecular Formula, Description)
            if (keyword != null && !keyword.trim().isBlank()) {
                String safeKeyword = keyword.trim();
                if (safeKeyword.length() > 100) {
                    safeKeyword = safeKeyword.substring(0, 100);
                }
                String pattern = "%" + safeKeyword.toLowerCase() + "%";

                Predicate matchName = cb.like(cb.lower(root.get("name")), pattern);
                Predicate matchCode = cb.like(cb.lower(root.get("productCode")), pattern);
                Predicate matchCas = cb.like(cb.lower(root.get("casNumber")), pattern);
                Predicate matchFormula = cb.like(cb.lower(root.get("molecularFormula")), pattern);
                Predicate matchDesc = cb.like(cb.lower(root.get("description")), pattern);

                predicates.add(cb.or(matchName, matchCode, matchCas, matchFormula, matchDesc));
            }

            // 2. Category / Categories filter
            if (categories != null && !categories.isEmpty()) {
                predicates.add(root.get("category").in(categories));
            }

            // 3. Exact or normalized CAS filter
            if (casNumber != null && !casNumber.trim().isBlank()) {
                String safeCas = casNumber.trim().toLowerCase();
                predicates.add(cb.equal(cb.lower(root.get("casNumber")), safeCas));
            }

            // 4. Purity range filter
            if (purityMin != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("purity"), purityMin));
            }
            if (purityMax != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("purity"), purityMax));
            }

            // 5. MOQ range filter
            if (moqMin != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("moqKg"), moqMin));
            }
            if (moqMax != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("moqKg"), moqMax));
            }

            // 6. In-Stock filter
            if (Boolean.TRUE.equals(inStock)) {
                predicates.add(cb.greaterThan(root.get("stock"), 0));
            }

            // 7. Quality & Compliance Documentation filters
            if (Boolean.TRUE.equals(coaAvailable)) {
                predicates.add(cb.isTrue(root.get("coaAvailable")));
            }
            if (Boolean.TRUE.equals(msdsAvailable)) {
                predicates.add(cb.isTrue(root.get("msdsAvailable")));
            }
            if (Boolean.TRUE.equals(exportReady)) {
                predicates.add(cb.isTrue(root.get("exportReady")));
            }

            // 8. Specific availability status filter (e.g. IN_STOCK, MADE_TO_ORDER)
            if (availabilityStatus != null && !availabilityStatus.trim().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("availabilityStatus")), availabilityStatus.trim().toUpperCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
