package com.kemkendra.admin;

import com.kemkendra.admin.dto.TestDataResetReportResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminSystemDataResetService {

    private static final Logger log = LoggerFactory.getLogger(AdminSystemDataResetService.class);

    private final JdbcTemplate jdbcTemplate;
    private final boolean resetEnabled;

    public AdminSystemDataResetService(
            JdbcTemplate jdbcTemplate,
            @Value("${kemkendra.test-data-reset.enabled:true}") boolean resetEnabled) {
        this.jdbcTemplate = jdbcTemplate;
        this.resetEnabled = resetEnabled;
    }

    public TestDataResetReportResponse executeTestDataReset(Authentication authentication) {
        if (!resetEnabled) {
            throw new AccessDeniedException("Test data reset feature is disabled in environment configuration.");
        }

        log.warn("ADMIN INITIATED CONTROLLED TEST DATA RESET");

        // 1. Break self-referencing FK on RFQs
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL");

        // 2. Delete transactional child records in FK-safe order
        int notificationsDeleted = jdbcTemplate.update("DELETE FROM notifications");
        int documentsDeleted = jdbcTemplate.update("DELETE FROM documents");
        int shipmentsDeleted = jdbcTemplate.update("DELETE FROM shipments");
        int purchaseOrdersDeleted = jdbcTemplate.update("DELETE FROM purchase_orders");
        int quotationsDeleted = jdbcTemplate.update("DELETE FROM quotations");
        int rfqsDeleted = jdbcTemplate.update("DELETE FROM rfqs");
        int productRequestsDeleted = jdbcTemplate.update("DELETE FROM product_requests");

        // 3. Delete offering / catalog records
        int offeringDocsDeleted = 0;
        try { offeringDocsDeleted = jdbcTemplate.update("DELETE FROM supplier_offering_documents"); } catch (Exception ignored) {}
        int offeringImagesDeleted = 0;
        try { offeringImagesDeleted = jdbcTemplate.update("DELETE FROM supplier_offering_images"); } catch (Exception ignored) {}

        int offeringsDeleted = jdbcTemplate.update("DELETE FROM supplier_offerings");

        // 4. Delete legacy products & mappings
        int productMasterMappingsDeleted = 0;
        try { productMasterMappingsDeleted = jdbcTemplate.update("DELETE FROM product_master_mappings"); } catch (Exception ignored) {}
        int legacyImagesDeleted = 0;
        try { legacyImagesDeleted = jdbcTemplate.update("DELETE FROM product_images"); } catch (Exception ignored) {}
        int legacyProductSuppliersDeleted = jdbcTemplate.update("DELETE FROM product_suppliers");
        int legacyProductsDeleted = jdbcTemplate.update("DELETE FROM products");

        // 5. Delete master product images & master products
        int masterImagesDeleted = 0;
        try { masterImagesDeleted = jdbcTemplate.update("DELETE FROM master_product_images"); } catch (Exception ignored) {}
        int masterProductsDeleted = jdbcTemplate.update("DELETE FROM master_products");

        log.info("Test data reset completed successfully.");

        return new TestDataResetReportResponse(
                masterProductsDeleted,
                offeringsDeleted,
                productRequestsDeleted,
                rfqsDeleted,
                quotationsDeleted,
                purchaseOrdersDeleted,
                notificationsDeleted,
                documentsDeleted,
                legacyImagesDeleted + offeringImagesDeleted + masterImagesDeleted,
                "Controlled test data reset completed successfully. Canonical schema and user accounts preserved."
        );
    }
}
