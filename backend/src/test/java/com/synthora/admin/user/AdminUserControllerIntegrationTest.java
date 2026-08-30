package com.synthora.admin.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.user.dto.UpdateUserRoleRequest;
import com.synthora.admin.user.dto.UpdateUserStatusRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.LoginRequest;
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

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminUserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

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

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        adminUser = new User();
        adminUser.setName("Admin One");
        adminUser.setEmail("admin1@synthora.com");
        adminUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        buyerUser = new User();
        buyerUser.setName("Buyer John");
        buyerUser.setEmail("buyer.john@buyer.com");
        buyerUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser.setEmailVerifiedAt(Instant.now());
        buyerUser = userRepository.save(buyerUser);
        buyerToken = jwtService.generateToken(buyerUser);

        supplierUser = new User();
        supplierUser.setName("Supplier Jane");
        supplierUser.setEmail("supplier.jane@supplier.com");
        supplierUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setEmailVerifiedAt(Instant.now());
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);
    }

    @Test
    public void testGetUsers_AdminAllowed_NonAdminBlocked() throws Exception {
        // Admin gets 200 with Page content
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.content[0].password").doesNotExist());

        // Buyer gets 403
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        // Supplier gets 403
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());

        // Unauthenticated gets 401
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testGetUserDetail_AdminAllowed_NotFound404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/" + buyerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(buyerUser.getId().toString()))
                .andExpect(jsonPath("$.name").value("Buyer John"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        mockMvc.perform(get("/api/v1/admin/users/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testSuspendAndActivate_AuthEnforcement() throws Exception {
        // 1. Suspend buyer
        UpdateUserStatusRequest suspendReq = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Suspicious activity detected");
        mockMvc.perform(put("/api/v1/admin/users/" + buyerUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(suspendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // 2. Buyer attempts login -> Authenticated with suspension review message
        LoginRequest loginReq = new LoginRequest(buyerUser.getEmail(), "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Your Synthora account is currently suspended")))
                .andExpect(jsonPath("$.token").exists());

        // 3. Reactivate buyer
        UpdateUserStatusRequest activateReq = new UpdateUserStatusRequest(UserStatus.ACTIVE, "Reinstated");
        mockMvc.perform(put("/api/v1/admin/users/" + buyerUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(activateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // 4. Buyer attempts login -> Success!
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        assertEquals(2, auditLogRepository.count());
    }

    @Test
    public void testRoleManagement_PromoteUser() throws Exception {
        UpdateUserRoleRequest roleReq = new UpdateUserRoleRequest(UserRole.SUPPLIER);
        mockMvc.perform(put("/api/v1/admin/users/" + buyerUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SUPPLIER"));

        assertEquals(1, auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.USER, buyerUser.getId().toString()).size());
        assertEquals(AuditAction.USER_ROLE_CHANGED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testSoftDelete_BlocksAuth() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/" + supplierUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedAt").isNotEmpty())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        // Soft deleted supplier cannot login
        LoginRequest loginReq = new LoginRequest(supplierUser.getEmail(), "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }
}
