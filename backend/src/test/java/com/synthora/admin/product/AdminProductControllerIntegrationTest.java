package com.synthora.admin.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.product.dto.UpdateAdminProductRequest;
import com.synthora.admin.product.dto.UpdateProductAvailabilityRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.*;
import com.synthora.product.dto.ProductSupplierRequest;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminProductControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductSupplierRepository productSupplierRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User buyerUser;
    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private ProductSupplier productSupplier;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("DELETE FROM audit_logs");
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute(
                "UPDATE rfqs SET accepted_quotation_id = NULL; " +
                "DELETE FROM shipments; " +
                "DELETE FROM purchase_orders; " +
                "DELETE FROM quotations; " +
                "DELETE FROM rfqs; " +
                "DELETE FROM documents; " +
                "DELETE FROM product_suppliers; " +
                "DELETE FROM products; " +
                "DELETE FROM seller_profiles; " +
                "DELETE FROM suppliers; " +
                "DELETE FROM users;"
        );

        adminUser = new User();
        adminUser.setName("Admin One");
        adminUser.setEmail("admin1@synthora.com");
        adminUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        buyerUser = new User();
        buyerUser.setName("Buyer John");
        buyerUser.setEmail("buyer.john@buyer.com");
        buyerUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerToken = jwtService.generateToken(buyerUser);

        supplierUser = new User();
        supplierUser.setName("Supplier Jane");
        supplierUser.setEmail("supplier.jane@supplier.com");
        supplierUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        supplier = new Supplier();
        supplier.setName("Apex Solvents");
        supplier.setSlug("apex-solvents");
        supplier.setCountryCode("US");
        supplier.setCountryName("United States");
        supplier.setVerified(true);
        supplier.setUser(supplierUser);
        supplier.setCreatedAt(LocalDateTime.now());
        supplier = supplierRepository.save(supplier);

        product = new Product();
        product.setName("Acetone High Purity");
        product.setDescription("Chemical intermediate");
        product.setPrice(new BigDecimal("120.00"));
        product.setStock(400);
        product.setCategory(ProductCategory.SOLVENT);
        product.setCasNumber("67-64-1");
        product.setAvailabilityStatus("AVAILABLE");
        product.setSeller(supplierUser);
        product = productRepository.save(product);

        productSupplier = new ProductSupplier();
        productSupplier.setProduct(product);
        productSupplier.setSupplier(supplier);
        productSupplier.setPurity("99.8%");
        productSupplier.setGrade("Technical Grade");
        productSupplier = productSupplierRepository.save(productSupplier);
    }

    @Test
    public void testGetProducts_SecurityGating() throws Exception {
        // Admin gets 200
        mockMvc.perform(get("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Acetone High Purity"));

        // Buyer gets 403
        mockMvc.perform(get("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        // Supplier gets 403
        mockMvc.perform(get("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUpdateAvailability_AdminOnly_WithAudit() throws Exception {
        UpdateProductAvailabilityRequest req = new UpdateProductAvailabilityRequest("HIDDEN", "Temporary delisting");

        mockMvc.perform(put("/api/v1/admin/products/" + product.getId() + "/availability")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("HIDDEN"));

        assertEquals(1, auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PRODUCT, product.getId().toString()).size());
        assertEquals(AuditAction.PRODUCT_UPDATED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testDeactivateProduct_DiscontinuedState() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/products/" + product.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("DISCONTINUED"));

        assertTrue(productRepository.existsById(product.getId()));
        assertEquals(AuditAction.PRODUCT_DELETED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testProductSupplier_AdminOfferingUpdateAndDeletion() throws Exception {
        ProductSupplierRequest updateReq = new ProductSupplierRequest("99.99%", "Ultra Pure", new BigDecimal("75.00"), "Drums", 4, true, true);

        // Update offering
        mockMvc.perform(put("/api/v1/admin/products/" + product.getId() + "/suppliers/" + supplier.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purity").value("99.99%"));

        // Delete offering
        mockMvc.perform(delete("/api/v1/admin/products/" + product.getId() + "/suppliers/" + supplier.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Association removed
        mockMvc.perform(get("/api/v1/admin/products/" + product.getId() + "/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    public void testPublicVisibility_HiddenProductExcludedFromPublicCatalog() throws Exception {
        // Mark product HIDDEN
        product.setAvailabilityStatus("HIDDEN");
        productRepository.save(product);

        // Public list must not show hidden product
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // Public detail must return 404
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/detail"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testPublicVisibility_SuspendedSupplierExcludedFromOfferingComparison() throws Exception {
        // Suspend supplier user
        supplierUser.setStatus(UserStatus.SUSPENDED);
        userRepository.save(supplierUser);

        // Public offerings for product must be empty
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
