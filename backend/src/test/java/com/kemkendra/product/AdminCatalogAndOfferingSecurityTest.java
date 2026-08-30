package com.kemkendra.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.product.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
public class AdminCatalogAndOfferingSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User supplierUserA;
    private User supplierUserB;
    private User buyerUser;

    private Supplier supplierA;
    private Supplier supplierB;
    private MasterProduct testMasterProduct;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // 1. Admin
        adminUser = new User(
                UUID.randomUUID(),
                "Super Admin",
                "admin.catalog@kemkendra.com",
                "+1999999999",
                "password123",
                UserRole.ADMIN,
                UserStatus.ACTIVE
        );
        adminUser = userRepository.save(adminUser);

        // 2. Supplier User A & Supplier A
        supplierUserA = new User(
                UUID.randomUUID(),
                "Supplier Owner A",
                "supplier.a@chemcorp.com",
                "+1111111111",
                "password123",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("ChemCorp Global");
        supplierA.setLegalName("ChemCorp Global Solutions Ltd");
        supplierA.setCountryCode("US");
        supplierA.setCountryName("United States");
        supplierA.setVerified(true);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        // 3. Supplier User B & Supplier B
        supplierUserB = new User(
                UUID.randomUUID(),
                "Supplier Owner B",
                "supplier.b@apexchem.com",
                "+1222222222",
                "password123",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Apex Chemical Industries");
        supplierB.setLegalName("Apex Chemical Industries Inc");
        supplierB.setCountryCode("DE");
        supplierB.setCountryName("Germany");
        supplierB.setVerified(true);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);

        // 4. Buyer User
        buyerUser = new User(
                UUID.randomUUID(),
                "Buyer Account",
                "buyer@enterprise.com",
                "+1333333333",
                "password123",
                UserRole.USER,
                UserStatus.ACTIVE
        );
        buyerUser = userRepository.save(buyerUser);

        // 5. Initial Master Product
        testMasterProduct = new MasterProduct();
        testMasterProduct.setMasterProductCode("SYN-TEST-001");
        testMasterProduct.setName("Benzalkonium Chloride 80%");
        testMasterProduct.setCasNumber("63449-41-2");
        testMasterProduct.setMolecularFormula("C21H38ClN");
        testMasterProduct.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        testMasterProduct.setDescription("Antimicrobial surfactant and preservative");
        testMasterProduct.setStatus("ACTIVE");
        testMasterProduct = masterProductRepository.save(testMasterProduct);
    }

    // 1. Admin can create master product
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCanCreateMasterProduct() throws Exception {
        CreateMasterProductPayload payload = new CreateMasterProductPayload(
                "Cetrimonium Chloride 30%",
                "112-02-7",
                "C19H42ClN",
                ProductCategory.SPECIALTY_CHEMICAL,
                "Cationic surfactant and hair conditioning agent",
                "ACTIVE"
        );

        mockMvc.perform(post("/api/v1/admin/catalog/master-products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Cetrimonium Chloride 30%"))
                .andExpect(jsonPath("$.casNumber").value("112-02-7"))
                .andExpect(jsonPath("$.category").value("SPECIALTY_CHEMICAL"));
    }

    // 2. Admin can edit master product
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCanEditMasterProduct() throws Exception {
        UpdateMasterProductPayload payload = new UpdateMasterProductPayload(
                "Benzalkonium Chloride 80% (Refined Pharma Grade)",
                "63449-41-2",
                "C21H38ClN",
                ProductCategory.SPECIALTY_CHEMICAL,
                "High purity refined grade",
                "ACTIVE",
                "Updated specification standards"
        );

        mockMvc.perform(put("/api/v1/admin/catalog/master-products/" + testMasterProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Benzalkonium Chloride 80% (Refined Pharma Grade)"))
                .andExpect(jsonPath("$.description").value("High purity refined grade"));
    }

    // 3. Admin can activate/deactivate master product
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCanActivateDeactivateMasterProduct() throws Exception {
        mockMvc.perform(put("/api/v1/admin/catalog/master-products/" + testMasterProduct.getId() + "/status")
                        .param("status", "INACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        MasterProduct updated = masterProductRepository.findById(testMasterProduct.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo("INACTIVE");
    }

    // 4. Admin can create supplier offering on behalf of supplier
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCanCreateSupplierOfferingOnBehalfOfSupplier() throws Exception {
        AdminCreateSupplierOfferingRequest req = new AdminCreateSupplierOfferingRequest(
                supplierA.getId(),
                testMasterProduct.getId(),
                new BigDecimal("1250.00"),
                "INR",
                5000,
                new BigDecimal("99.50"),
                "Pharma / USP",
                new BigDecimal("100.00"),
                "200L HDPE Drums",
                7,
                true,
                true,
                true,
                "AVAILABLE",
                "APPROVED",
                "Created during corporate verification onboarding"
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplierId").value(supplierA.getId()))
                .andExpect(jsonPath("$.supplierName").value("ChemCorp Global"))
                .andExpect(jsonPath("$.price").value(1250.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.moderationStatus").value("APPROVED"))
                .andExpect(jsonPath("$.createdByRole").value("ADMIN"))
                .andExpect(jsonPath("$.createdByAdminName").value("Super Admin"));

        SupplierOffering saved = supplierOfferingRepository.findByMasterProductIdAndSupplierId(testMasterProduct.getId(), supplierA.getId()).orElseThrow();
        assertThat(saved.getSupplier().getId()).isEqualTo(supplierA.getId());
        assertThat(saved.getCreatedByRole()).isEqualTo("ADMIN");
        assertThat(saved.getCreatedByAdminId()).isEqualTo(adminUser.getId());
    }

    // 5. Admin can edit supplier offering
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCanEditSupplierOffering() throws Exception {
        // First create offering
        SupplierOffering offering = new SupplierOffering();
        offering.setMasterProduct(testMasterProduct);
        offering.setSupplier(supplierA);
        offering.setPrice(new BigDecimal("1000.00"));
        offering.setCurrency("INR");
        offering.setStock(200);
        offering = supplierOfferingRepository.save(offering);

        AdminUpdateSupplierOfferingRequest updateReq = new AdminUpdateSupplierOfferingRequest(
                new BigDecimal("1150.00"),
                "INR",
                450,
                new BigDecimal("99.80"),
                "Technical Grade",
                new BigDecimal("50.00"),
                "50kg Bags",
                5,
                true,
                true,
                true,
                "AVAILABLE",
                "APPROVED",
                "Verified spec compliance",
                "Price index adjustment"
        );

        mockMvc.perform(put("/api/v1/admin/catalog/offerings/" + offering.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(1150.00))
                .andExpect(jsonPath("$.stock").value(450))
                .andExpect(jsonPath("$.grade").value("Technical Grade"));
    }

    // 6. Admin can deactivate supplier offering
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCanDeactivateSupplierOffering() throws Exception {
        SupplierOffering offering = new SupplierOffering();
        offering.setMasterProduct(testMasterProduct);
        offering.setSupplier(supplierA);
        offering.setPrice(new BigDecimal("1000.00"));
        offering.setCurrency("INR");
        offering.setAvailabilityStatus("AVAILABLE");
        offering.setModerationStatus("APPROVED");
        offering = supplierOfferingRepository.save(offering);

        mockMvc.perform(put("/api/v1/admin/catalog/offerings/" + offering.getId() + "/status")
                        .param("status", "HIDDEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("HIDDEN"))
                .andExpect(jsonPath("$.moderationStatus").value("DEACTIVATED"));
    }

    // 7. Supplier can view own offering (including admin-created)
    @Test
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = {"SUPPLIER"})
    void supplierCanViewOwnOfferingIncludingAdminCreated() throws Exception {
        SupplierOffering offering = new SupplierOffering();
        offering.setMasterProduct(testMasterProduct);
        offering.setSupplier(supplierA);
        offering.setPrice(new BigDecimal("850.00"));
        offering.setCurrency("INR");
        offering.setCreatedByRole("ADMIN");
        offering.setCreatedByAdminName("Super Admin");
        offering = supplierOfferingRepository.save(offering);

        mockMvc.perform(get("/api/v1/supplier/offerings/" + offering.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(offering.getId().toString()))
                .andExpect(jsonPath("$.supplierId").value(supplierA.getId()))
                .andExpect(jsonPath("$.createdByRole").value("ADMIN"))
                .andExpect(jsonPath("$.createdByAdminName").value("Super Admin"));
    }

    // 8. Supplier cannot view another supplier's offering (IDOR)
    @Test
    @WithMockUser(username = "supplier.b@apexchem.com", roles = {"SUPPLIER"})
    void supplierCannotViewAnotherSuppliersOffering() throws Exception {
        SupplierOffering offeringA = new SupplierOffering();
        offeringA.setMasterProduct(testMasterProduct);
        offeringA.setSupplier(supplierA);
        offeringA.setPrice(new BigDecimal("850.00"));
        offeringA.setCurrency("INR");
        offeringA = supplierOfferingRepository.save(offeringA);

        mockMvc.perform(get("/api/v1/supplier/offerings/" + offeringA.getId()))
                .andExpect(status().isForbidden());
    }

    // 9. Supplier cannot create an offering for another supplier
    @Test
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = {"SUPPLIER"})
    void supplierCannotCreateOfferingForAnotherSupplier() throws Exception {
        // Supplier offering endpoint only accepts masterProductId and commercial terms,
        // and identity is strictly bound to the authenticated JWT principal.
        CreateSupplierOfferingRequest req = new CreateSupplierOfferingRequest(
                testMasterProduct.getId(),
                new BigDecimal("990.00"),
                "INR",
                100,
                new BigDecimal("99.00"),
                "USP",
                new BigDecimal("10.00"),
                "Drums",
                3,
                true,
                true,
                true,
                "AVAILABLE"
        );

        mockMvc.perform(post("/api/v1/supplier/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplierId").value(supplierA.getId()))
                .andExpect(jsonPath("$.createdByRole").value("SUPPLIER"));
    }

    // 10. USER/BUYER receives 403 Forbidden for admin catalog & offering management
    @Test
    @WithMockUser(username = "buyer@enterprise.com", roles = {"USER"})
    void buyerReceivesForbiddenForAdminCatalogManagement() throws Exception {
        AdminCreateSupplierOfferingRequest req = new AdminCreateSupplierOfferingRequest(
                supplierA.getId(),
                testMasterProduct.getId(),
                new BigDecimal("100.00"),
                "INR",
                10,
                null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/catalog/master-products"))
                .andExpect(status().isForbidden());
    }

    // 11. Supplier cannot modify admin catalog master products without authorization
    @Test
    @WithMockUser(username = "supplier.a@chemcorp.com", roles = {"SUPPLIER"})
    void supplierCannotModifyAdminCatalogMasterProducts() throws Exception {
        UpdateMasterProductPayload payload = new UpdateMasterProductPayload(
                "Hacked Product Name", "00-00-0", "HACK", ProductCategory.SPECIALTY_CHEMICAL, "Hacked", "ACTIVE", "Unauthorized hack attempt"
        );

        mockMvc.perform(put("/api/v1/admin/catalog/master-products/" + testMasterProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden());
    }

    // 12. Admin-created offering remains owned by selected supplier
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void adminCreatedOfferingRemainsOwnedBySelectedSupplier() throws Exception {
        AdminCreateSupplierOfferingRequest req = new AdminCreateSupplierOfferingRequest(
                supplierB.getId(),
                testMasterProduct.getId(),
                new BigDecimal("4500.00"),
                "EUR",
                1200,
                new BigDecimal("99.90"),
                "Analytical Grade",
                new BigDecimal("25.00"),
                "Glass Bottles",
                2,
                true,
                true,
                true,
                "AVAILABLE",
                "APPROVED",
                "Direct onboarding by KemKendra admin team"
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplierId").value(supplierB.getId()))
                .andExpect(jsonPath("$.supplierName").value("Apex Chemical Industries"))
                .andExpect(jsonPath("$.createdByRole").value("ADMIN"));

        SupplierOffering offering = supplierOfferingRepository.findByMasterProductIdAndSupplierId(testMasterProduct.getId(), supplierB.getId()).orElseThrow();
        assertThat(offering.getSupplier().getId()).isEqualTo(supplierB.getId());
        assertThat(offering.getSupplier().getName()).isEqualTo("Apex Chemical Industries");
    }

    // 13. Duplicate product offering protection per supplier/product
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void duplicateOfferingProtectionPerSupplierAndProduct() throws Exception {
        // Create initial offering
        SupplierOffering offering = new SupplierOffering();
        offering.setMasterProduct(testMasterProduct);
        offering.setSupplier(supplierA);
        offering.setPrice(new BigDecimal("1000.00"));
        offering.setCurrency("INR");
        supplierOfferingRepository.save(offering);

        AdminCreateSupplierOfferingRequest duplicateReq = new AdminCreateSupplierOfferingRequest(
                supplierA.getId(),
                testMasterProduct.getId(),
                new BigDecimal("1200.00"),
                "INR",
                100, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateReq)))
                .andExpect(status().isConflict());
    }

    // 14. Invalid supplier/product IDs are rejected safely (404)
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void invalidSupplierOrProductIdsRejectedSafely() throws Exception {
        AdminCreateSupplierOfferingRequest invalidSupReq = new AdminCreateSupplierOfferingRequest(
                99999L,
                testMasterProduct.getId(),
                new BigDecimal("1000.00"),
                "INR",
                100, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidSupReq)))
                .andExpect(status().isNotFound());

        AdminCreateSupplierOfferingRequest invalidProdReq = new AdminCreateSupplierOfferingRequest(
                supplierA.getId(),
                UUID.randomUUID(),
                new BigDecimal("1000.00"),
                "INR",
                100, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidProdReq)))
                .andExpect(status().isNotFound());
    }

    // 15. Provenance is correctly preserved and returned in responses
    @Test
    @WithMockUser(username = "admin.catalog@kemkendra.com", roles = {"ADMIN"})
    void provenanceIsCorrectlyPreservedAndReturned() throws Exception {
        AdminCreateSupplierOfferingRequest req = new AdminCreateSupplierOfferingRequest(
                supplierA.getId(),
                testMasterProduct.getId(),
                new BigDecimal("2100.00"),
                "USD",
                800,
                new BigDecimal("98.00"),
                "Technical",
                new BigDecimal("500.00"),
                "Iso Containers",
                14,
                false,
                true,
                true,
                "AVAILABLE",
                "APPROVED",
                "Created by Admin"
        );

        mockMvc.perform(post("/api/v1/admin/catalog/offerings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.createdByRole").value("ADMIN"))
                .andExpect(jsonPath("$.createdByAdminName").value("Super Admin"))
                .andExpect(jsonPath("$.createdByAdminId").value(adminUser.getId().toString()));
    }
}
