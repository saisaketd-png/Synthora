package com.kemkendra.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.product.dto.ProductSupplierRequest;
import com.kemkendra.rfq.dto.CreateRfqRequest;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 2E.4 — ProductSupplier Association Management Security Tests.
 *
 * Covers creation, retrieval, update, deletion, security, and full regression
 * of procurement, supplier discovery, and document workflows.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProductSupplierSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSupplierRepository productSupplierRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User buyer;
    private String buyerToken;

    private User supplierUser1;
    private String supplier1Token;
    private Supplier operationalSupplier1;

    private User supplierUser2;
    private String supplier2Token;
    private Supplier operationalSupplier2;

    private Product product;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Buyer
        buyer = new User();
        buyer.setEmail("buyer2e4@kemkendra.com");
        buyer.setName("Buyer 2E4");
        buyer.setPasswordHash("hash");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer = userRepository.save(buyer);
        buyerToken = jwtService.generateToken(buyer);

        // Supplier 1
        supplierUser1 = new User();
        supplierUser1.setEmail("s1@2e4.com");
        supplierUser1.setName("Supplier 1");
        supplierUser1.setPasswordHash("hash");
        supplierUser1.setRole(UserRole.SUPPLIER);
        supplierUser1.setStatus(UserStatus.ACTIVE);
        supplierUser1 = userRepository.save(supplierUser1);
        supplier1Token = jwtService.generateToken(supplierUser1);

        operationalSupplier1 = new Supplier();
        operationalSupplier1.setUser(supplierUser1);
        operationalSupplier1.setName("Acme Chemicals Ltd");
        operationalSupplier1.setSlug("acme-chemicals-2e4");
        operationalSupplier1.setCountryName("India");
        operationalSupplier1.setVerified(true);
        operationalSupplier1.setExportReady(true);
        operationalSupplier1.setYearsInBusiness(10);
        operationalSupplier1.setResponseRate(95);
        operationalSupplier1 = supplierRepository.save(operationalSupplier1);

        // Supplier 2
        supplierUser2 = new User();
        supplierUser2.setEmail("s2@2e4.com");
        supplierUser2.setName("Supplier 2");
        supplierUser2.setPasswordHash("hash");
        supplierUser2.setRole(UserRole.SUPPLIER);
        supplierUser2.setStatus(UserStatus.ACTIVE);
        supplierUser2 = userRepository.save(supplierUser2);
        supplier2Token = jwtService.generateToken(supplierUser2);

        operationalSupplier2 = new Supplier();
        operationalSupplier2.setUser(supplierUser2);
        operationalSupplier2.setName("Beta Pharma Ltd");
        operationalSupplier2.setSlug("beta-pharma-2e4");
        operationalSupplier2.setCountryName("Germany");
        operationalSupplier2.setVerified(false);
        operationalSupplier2.setExportReady(false);
        operationalSupplier2 = supplierRepository.save(operationalSupplier2);

        // Product owned by supplier 1
        product = new Product();
        product.setSeller(supplierUser1);
        product.setName("Paracetamol API");
        product.setDescription("High-purity paracetamol API");
        product.setCategory(ProductCategory.API);
        product.setPrice(new BigDecimal("50.00"));
        product.setStock(500);
        product.setCasNumber("103-90-2");
        product = productRepository.save(product);
    }

    // -----------------------------------------------------------------------
    // CREATION TESTS (1-5)
    // -----------------------------------------------------------------------

    @Test
    public void test01_SupplierCanCreateOffering() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
            "≥99.5%", "USP Grade", new BigDecimal("25.0"), "25kg Fiber Drum", 14, true, true
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.productId").value(product.getId().toString()))
                .andExpect(jsonPath("$.purity").value("≥99.5%"))
                .andExpect(jsonPath("$.grade").value("USP Grade"))
                .andExpect(jsonPath("$.moqKg").value(25.0))
                .andExpect(jsonPath("$.coaAvailable").value(true));

        assertEquals(1, productSupplierRepository.findByProductId(product.getId()).size());
    }

    @Test
    public void test02_CorrectSupplierIsStored() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
            "≥99%", "BP Grade", new BigDecimal("50.0"), "Drum", 21, false, false
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        ProductSupplier ps = productSupplierRepository.findByProductId(product.getId()).get(0);
        assertEquals(operationalSupplier1.getId(), ps.getSupplier().getId());
    }

    @Test
    public void test03_CorrectProductIsStored() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
            null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        ProductSupplier ps = productSupplierRepository.findByProductId(product.getId()).get(0);
        assertEquals(product.getId(), ps.getProduct().getId());
    }

    @Test
    public void test04_CommercialFieldsPersist() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
            "≥99.9%", "GMP Grade", new BigDecimal("100.0"), "HDPE Bag", 7, true, true
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        ProductSupplier ps = productSupplierRepository
                .findByProductIdAndSupplierId(product.getId(), operationalSupplier1.getId()).get();
        assertEquals("≥99.9%", ps.getPurity());
        assertEquals("GMP Grade", ps.getGrade());
        assertEquals(0, new BigDecimal("100.0").compareTo(ps.getMoqKg()));
        assertEquals("HDPE Bag", ps.getPackaging());
        assertEquals(7, ps.getLeadTimeDays());
        assertTrue(ps.getCoaAvailable());
        assertTrue(ps.getMsdsAvailable());
    }

    @Test
    public void test05_DuplicateCreationReturns409() throws Exception {
        // Create first offering
        ProductSupplierRequest req = new ProductSupplierRequest(
            "≥99%", "USP", new BigDecimal("25.0"), "Drum", 14, true, false
        );
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Attempt duplicate
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());

        assertEquals(1, productSupplierRepository.findByProductId(product.getId()).size());
    }

    // -----------------------------------------------------------------------
    // RETRIEVAL TESTS (6-8)
    // -----------------------------------------------------------------------

    @Test
    public void test06_SupplierCanRetrieveOwnOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(product.getId().toString()))
                .andExpect(jsonPath("$.purity").value("≥99%"));
    }

    @Test
    public void test07_SupplierCannotRetrieveAnotherSuppliersOffering() throws Exception {
        // Supplier 1 creates offering
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        // Supplier 2 tries to retrieve supplier 1's offering for the same product
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isNotFound()); // Information hiding — 404, not 403
    }

    @Test
    public void test08_SupplierCanRetrieveOwnOfferingRegister() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        mockMvc.perform(get("/api/v1/suppliers/me/product-offerings")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].productId").value(product.getId().toString()));
    }

    // -----------------------------------------------------------------------
    // UPDATE TESTS (9-11)
    // -----------------------------------------------------------------------

    @Test
    public void test09_SupplierCanUpdateOwnOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        ProductSupplierRequest update = new ProductSupplierRequest(
            "≥99.9%", "GMP Grade", new BigDecimal("50.0"), "HDPE Bag", 7, true, true
        );

        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purity").value("≥99.9%"))
                .andExpect(jsonPath("$.grade").value("GMP Grade"))
                .andExpect(jsonPath("$.leadTimeDays").value(7));
    }

    @Test
    public void test10_SupplierCannotUpdateAnotherSuppliersOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        ProductSupplierRequest update = new ProductSupplierRequest(
            "≥50%", "Hacked", null, null, null, null, null
        );

        // Supplier 2 tries to update Supplier 1's offering
        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier2Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound()); // 404 — information hiding

        // Verify supplier 1's data unchanged
        ProductSupplier ps = productSupplierRepository
                .findByProductIdAndSupplierId(product.getId(), operationalSupplier1.getId()).get();
        assertEquals("≥99%", ps.getPurity());
    }

    @Test
    public void test11_ProductSellerRemainsUnchangedAfterUpdate() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        // Supplier 2 creates their own offering on same product
        createOffering(operationalSupplier2, "≥98%", "BP", "100.0", "Bag", 21, false, false);

        // Supplier 2 updates their own offering
        ProductSupplierRequest update = new ProductSupplierRequest("≥99%", null, null, null, null, null, null);
        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier2Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());

        // Product.seller must still be supplier 1's user
        Product reloaded = productRepository.findById(product.getId()).get();
        assertEquals(supplierUser1.getId(), reloaded.getSeller().getId(),
                "Product.seller must not change when another supplier updates their offering");
    }

    // -----------------------------------------------------------------------
    // DELETE TESTS (12-13)
    // -----------------------------------------------------------------------

    @Test
    public void test12_SupplierCanDeleteOwnOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        mockMvc.perform(delete("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isNoContent());

        assertFalse(productSupplierRepository
                .existsByProductIdAndSupplierId(product.getId(), operationalSupplier1.getId()));
    }

    @Test
    public void test13_SupplierCannotDeleteAnotherSuppliersOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        // Supplier 2 tries to delete Supplier 1's offering
        mockMvc.perform(delete("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isNotFound());

        // Offering still exists
        assertTrue(productSupplierRepository
                .existsByProductIdAndSupplierId(product.getId(), operationalSupplier1.getId()));
    }

    // -----------------------------------------------------------------------
    // SECURITY TESTS (14-17)
    // -----------------------------------------------------------------------

    @Test
    public void test14_BuyerCannotCreateOffering() throws Exception {
        ProductSupplierRequest req = new ProductSupplierRequest(
            "≥99%", "USP", new BigDecimal("25.0"), "Drum", 14, true, false
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        assertEquals(0, productSupplierRepository.findByProductId(product.getId()).size());
    }

    @Test
    public void test15_BuyerCannotUpdateOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        ProductSupplierRequest update = new ProductSupplierRequest("≥50%", null, null, null, null, null, null);

        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void test16_BuyerCannotDeleteOffering() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);

        mockMvc.perform(delete("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        assertTrue(productSupplierRepository
                .existsByProductIdAndSupplierId(product.getId(), operationalSupplier1.getId()));
    }

    @Test
    public void test17_UnauthenticatedRequestsAreRejected() throws Exception {
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/supplier-offering")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/supplier-offering"))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/supplier-offering")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/products/" + product.getId() + "/supplier-offering"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/suppliers/me/product-offerings"))
                .andExpect(status().isForbidden());
    }

    // -----------------------------------------------------------------------
    // REGRESSION TESTS (18-25)
    // -----------------------------------------------------------------------

    @Test
    public void test18_PublicProductSupplierComparisonStillWorks() throws Exception {
        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);
        createOffering(operationalSupplier2, "≥98%", "BP", "100.0", "Bag", 21, false, false);

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    public void test19_PublicSupplierCatalogStillWorks() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    public void test20_ProductDetailStillWorks() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(product.getId().toString()));
    }

    @Test
    public void test21_RfqCreationStillWorks() throws Exception {
        CreateRfqRequest rfqRequest = new CreateRfqRequest(
                product.getId(),
                operationalSupplier1.getId(),
                new BigDecimal("25.0"),
                "kg",
                "Test RFQ for regression"
        );

        mockMvc.perform(post("/api/v1/rfqs")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(rfqRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    public void test22_SupplierComparisonAfterOfferingCreation() throws Exception {
        // Before association — should be empty
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // After association — should appear
        createOffering(operationalSupplier1, "≥99.5%", "USP Grade", "25.0", "Drum", 14, true, true);

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].supplierId").value(operationalSupplier1.getId()))
                .andExpect(jsonPath("$[0].purity").value("≥99.5%"))
                .andExpect(jsonPath("$[0].moqKg").value(25.0));
    }

    @Test
    public void test23_ProductNotFoundReturns404() throws Exception {
        UUID nonexistentId = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/products/" + nonexistentId + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new ProductSupplierRequest(null, null, null, null, null, null, null))))
                .andExpect(status().isNotFound());
    }

    @Test
    public void test24_MultipleSupplierOfferingsCoexistForSameProduct() throws Exception {
        createOffering(operationalSupplier1, "≥99.5%", "USP", "25.0", "Drum", 14, true, true);
        createOffering(operationalSupplier2, "≥98%", "BP", "100.0", "Bag", 21, false, false);

        assertEquals(2, productSupplierRepository.findByProductId(product.getId()).size());

        // Each supplier sees only their own offering via management endpoint
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purity").value("≥99.5%"));

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/supplier-offering")
                .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purity").value("≥98%"));
    }

    @Test
    public void test25_SupplierOfferingsRegisterIsIsolated() throws Exception {
        // Create a second product
        Product product2 = new Product();
        product2.setSeller(supplierUser1);
        product2.setName("Ibuprofen API");
        product2.setCategory(ProductCategory.API);
        product2.setPrice(new BigDecimal("40.00"));
        product2.setStock(200);
        product2 = productRepository.save(product2);

        createOffering(operationalSupplier1, "≥99%", "USP", "25.0", "Drum", 14, true, false);
        createOfferingFor(operationalSupplier1, product2.getId(), "≥99.5%", "GMP", "50.0", "Bag", 7, true, true);
        createOffering(operationalSupplier2, "≥98%", "BP", "100.0", "Bag", 21, false, false);

        // Supplier 1 should see exactly 2 offerings
        mockMvc.perform(get("/api/v1/suppliers/me/product-offerings")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Supplier 2 should see exactly 1 offering
        mockMvc.perform(get("/api/v1/suppliers/me/product-offerings")
                .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private void createOffering(Supplier supplier, String purity, String grade,
                                 String moqKg, String packaging, int leadTimeDays,
                                 boolean coa, boolean msds) {
        createOfferingFor(supplier, product.getId(), purity, grade, moqKg, packaging, leadTimeDays, coa, msds);
    }

    private void createOfferingFor(Supplier supplier, UUID productId, String purity, String grade,
                                    String moqKg, String packaging, int leadTimeDays,
                                    boolean coa, boolean msds) {
        Product p = productRepository.findById(productId).orElseThrow();
        ProductSupplier ps = new ProductSupplier();
        ps.setProduct(p);
        ps.setSupplier(supplier);
        ps.setPurity(purity);
        ps.setGrade(grade);
        ps.setMoqKg(new BigDecimal(moqKg));
        ps.setPackaging(packaging);
        ps.setLeadTimeDays(leadTimeDays);
        ps.setCoaAvailable(coa);
        ps.setMsdsAvailable(msds);
        productSupplierRepository.save(ps);
    }
}
