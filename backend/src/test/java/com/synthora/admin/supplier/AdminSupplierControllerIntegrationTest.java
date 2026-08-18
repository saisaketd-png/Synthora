package com.synthora.admin.supplier;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.supplier.dto.UpdateSupplierExportReadyRequest;
import com.synthora.admin.supplier.dto.UpdateSupplierStatusRequest;
import com.synthora.admin.supplier.dto.UpdateSupplierVerificationRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
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

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminSupplierControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

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
        supplier.setVerified(false);
        supplier.setExportReady(false);
        supplier.setUser(supplierUser);
        supplier.setCreatedAt(LocalDateTime.now());
        supplier = supplierRepository.save(supplier);
    }

    @Test
    public void testGetSuppliers_AdminAllowed_NonAdminForbidden() throws Exception {
        // Admin gets 200
        mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name").value("Apex Solvents"));

        // Buyer gets 403
        mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        // Supplier gets 403
        mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());

        // Unauthenticated gets 403/401
        mockMvc.perform(get("/api/v1/admin/suppliers"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testGetSupplierDetail_AdminAllowed_NotFound404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/suppliers/" + supplier.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(supplier.getId()))
                .andExpect(jsonPath("$.name").value("Apex Solvents"));

        mockMvc.perform(get("/api/v1/admin/suppliers/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testVerificationEndpoint_AdminOnly_WithAudit() throws Exception {
        UpdateSupplierVerificationRequest req = new UpdateSupplierVerificationRequest(true, "Document review completed");

        mockMvc.perform(put("/api/v1/admin/suppliers/" + supplier.getId() + "/verification")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        assertEquals(1, auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.SUPPLIER, supplier.getId().toString()).size());
        assertEquals(AuditAction.SUPPLIER_VERIFIED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testExportReadyEndpoint_AdminOnly_WithAudit() throws Exception {
        UpdateSupplierExportReadyRequest req = new UpdateSupplierExportReadyRequest(true, "Export certified");

        mockMvc.perform(put("/api/v1/admin/suppliers/" + supplier.getId() + "/export-ready")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exportReady").value(true));

        assertEquals(AuditAction.SUPPLIER_EXPORT_READY_CHANGED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testStatusEndpoint_SuspendSupplier_WithAudit() throws Exception {
        UpdateSupplierStatusRequest req = new UpdateSupplierStatusRequest(UserStatus.SUSPENDED, "Terms violation");

        mockMvc.perform(put("/api/v1/admin/suppliers/" + supplier.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userStatus").value("SUSPENDED"));

        assertEquals(AuditAction.SUPPLIER_SUSPENDED, auditLogRepository.findAll().get(0).getAction());
    }
}
