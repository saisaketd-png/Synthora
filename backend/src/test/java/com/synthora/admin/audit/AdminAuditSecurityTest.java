package com.synthora.admin.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminAuditSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User regularBuyer;
    private User regularSupplier;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    public void setup() {
        for (String sql : List.of(
                "UPDATE rfqs SET accepted_quotation_id = NULL",
                "DELETE FROM buyer_shortlist_items",
                "DELETE FROM buyer_shortlists",
                "DELETE FROM governance_audit_logs",
                "DELETE FROM audit_logs",
                "DELETE FROM notifications",
                "DELETE FROM account_suspension_appeals",
                "DELETE FROM account_suspensions",
                "DELETE FROM supplier_offering_verification_evidences",
                "DELETE FROM supplier_offering_audits",
                "DELETE FROM supplier_verification_evidences",
                "DELETE FROM supplier_verification_audits",
                "DELETE FROM product_requests",
                "DELETE FROM sourcing_requests",
                "DELETE FROM documents",
                "DELETE FROM shipments",
                "DELETE FROM purchase_orders",
                "DELETE FROM quotations",
                "DELETE FROM rfqs",
                "DELETE FROM supplier_offerings",
                "DELETE FROM product_master_mappings",
                "DELETE FROM master_products",
                "DELETE FROM product_images",
                "DELETE FROM product_suppliers",
                "DELETE FROM products",
                "DELETE FROM seller_profiles",
                "DELETE FROM suppliers",
                "DELETE FROM email_verification_tokens",
                "DELETE FROM password_reset_tokens",
                "DELETE FROM users"
        )) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {}
        }

        adminUser = new User();
        adminUser.setEmail("audit-admin@synthora.com");
        adminUser.setName("Chief Audit Officer");
        adminUser.setPasswordHash(passwordEncoder.encode("SecureAdminPassword123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        regularBuyer = new User();
        regularBuyer.setEmail("audit-buyer@synthora.com");
        regularBuyer.setName("Pharma Buyer");
        regularBuyer.setPasswordHash(passwordEncoder.encode("SecureBuyerPassword123!"));
        regularBuyer.setRole(UserRole.USER);
        regularBuyer.setStatus(UserStatus.ACTIVE);
        regularBuyer.setEmailVerifiedAt(Instant.now());
        regularBuyer = userRepository.save(regularBuyer);
        buyerToken = jwtService.generateToken(regularBuyer);

        regularSupplier = new User();
        regularSupplier.setEmail("audit-supplier@synthora.com");
        regularSupplier.setName("Chemical Supplier");
        regularSupplier.setPasswordHash(passwordEncoder.encode("SecureSupplierPassword123!"));
        regularSupplier.setRole(UserRole.SUPPLIER);
        regularSupplier.setStatus(UserStatus.ACTIVE);
        regularSupplier.setEmailVerifiedAt(Instant.now());
        regularSupplier = userRepository.save(regularSupplier);
        supplierToken = jwtService.generateToken(regularSupplier);
    }

    // =========================================================================
    // 1. Authorization & Role-Based Access Control
    // =========================================================================

    @Test
    @DisplayName("GET /api/v1/admin/audit - Unauthenticated request returns 401")
    public void testAuditApi_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit - Buyer role returns 403 Forbidden")
    public void testAuditApi_BuyerRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit - Supplier role returns 403 Forbidden")
    public void testAuditApi_SupplierRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit - Admin role returns 200 OK")
    public void testAuditApi_AdminRole_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit/summary - Admin role returns 200 OK with KPIs")
    public void testAuditSummary_AdminRole_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").isNumber())
                .andExpect(jsonPath("$.todayEvents").isNumber())
                .andExpect(jsonPath("$.userGovernanceEvents").isNumber())
                .andExpect(jsonPath("$.supplierGovernanceEvents").isNumber())
                .andExpect(jsonPath("$.catalogGovernanceEvents").isNumber());
    }

    @Test
    @DisplayName("GET /api/v1/admin/audit/summary - Non-admin roles return 403")
    public void testAuditSummary_NonAdmin_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit/summary")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/audit/summary")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 2. Actor Integrity & Identity Resolution
    // =========================================================================

    @Test
    @DisplayName("Actor integrity: Server resolves actor strictly from Authentication and enriches response")
    public void testAuditRecording_DerivesActorFromSecurityContext() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        auditService.record(
                auth,
                AuditAction.USER_SUSPENDED,
                AuditTargetType.USER,
                regularBuyer.getId().toString(),
                "Suspended for compliance violation",
                "192.168.1.100"
        );

        mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].adminId", is(adminUser.getId().toString())))
                .andExpect(jsonPath("$.content[0].adminName", is("Chief Audit Officer")))
                .andExpect(jsonPath("$.content[0].adminEmail", is("audit-admin@synthora.com")))
                .andExpect(jsonPath("$.content[0].action", is("USER_SUSPENDED")))
                .andExpect(jsonPath("$.content[0].targetType", is("USER")))
                .andExpect(jsonPath("$.content[0].targetId", is(regularBuyer.getId().toString())))
                .andExpect(jsonPath("$.content[0].ipAddress", is("192.168.1.100")));
    }

    // =========================================================================
    // 3. Immutability & Safe HTTP Methods
    // =========================================================================

    @Test
    @DisplayName("Immutability: PUT/PATCH/DELETE endpoints on audit trail are rejected (405 Method Not Allowed / 404 Not Found)")
    public void testAuditLog_NoUpdateOrDeleteEndpoints() throws Exception {
        UUID randomId = UUID.randomUUID();

        mockMvc.perform(put("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"details\":\"modified\"}"))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(patch("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"details\":\"modified\"}"))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(delete("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(put("/api/v1/admin/audit/" + randomId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"details\":\"modified\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/admin/audit/" + randomId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Immutability: AuditLog createdAt is set server-side and is non-null")
    public void testAuditLog_TimestampImmutable() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        AuditLog log = auditService.record(
                auth,
                AuditAction.USER_ACTIVATED,
                AuditTargetType.USER,
                regularBuyer.getId().toString(),
                "Activated account",
                "10.0.0.1"
        );

        assertNotNull(log.getCreatedAt());
        assertTrue(log.getCreatedAt().isBefore(LocalDateTime.now().plusSeconds(5)));
    }

    // =========================================================================
    // 4. Filtering & Search Engine
    // =========================================================================

    @Test
    @DisplayName("Filtering: Filter by AuditAction")
    public void testFilterByAction() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        auditService.record(auth, AuditAction.USER_SUSPENDED, AuditTargetType.USER, regularBuyer.getId().toString(), "Suspension 1", "127.0.0.1");
        auditService.record(auth, AuditAction.USER_REINSTATED, AuditTargetType.USER, regularBuyer.getId().toString(), "Reinstatement 1", "127.0.0.1");

        mockMvc.perform(get("/api/v1/admin/audit?action=USER_SUSPENDED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].action", is("USER_SUSPENDED")));

        mockMvc.perform(get("/api/v1/admin/audit?action=USER_REINSTATED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].action", is("USER_REINSTATED")));
    }

    @Test
    @DisplayName("Filtering: Filter by Target Type and Target ID")
    public void testFilterByTarget() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        String targetUser = regularBuyer.getId().toString();
        String targetSupplier = regularSupplier.getId().toString();

        auditService.record(auth, AuditAction.USER_SUSPENDED, AuditTargetType.USER, targetUser, "Suspended buyer", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_VERIFIED, AuditTargetType.SUPPLIER, targetSupplier, "Verified supplier", "127.0.0.1");

        mockMvc.perform(get("/api/v1/admin/audit?targetType=USER&targetId=" + targetUser)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].targetId", is(targetUser)));

        mockMvc.perform(get("/api/v1/admin/audit?targetType=SUPPLIER&targetId=" + targetSupplier)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].targetId", is(targetSupplier)));
    }

    @Test
    @DisplayName("Filtering: Filter by Date Range (from & to)")
    public void testFilterByDateRange() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        auditService.record(auth, AuditAction.USER_ROLE_CHANGED, AuditTargetType.USER, regularBuyer.getId().toString(), "Role change", "127.0.0.1");

        Instant now = Instant.now();
        Instant past = now.minus(1, ChronoUnit.HOURS);
        Instant future = now.plus(1, ChronoUnit.HOURS);

        mockMvc.perform(get("/api/v1/admin/audit?from=" + past.toString() + "&to=" + future.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)));

        Instant distantPast = now.minus(10, ChronoUnit.DAYS);
        Instant pastEnd = now.minus(5, ChronoUnit.DAYS);

        mockMvc.perform(get("/api/v1/admin/audit?from=" + distantPast.toString() + "&to=" + pastEnd.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    @DisplayName("Filtering: Free-text search matches details, target ID, and IP")
    public void testFilterBySearchQuery() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        String uniqueMarker = "AlphaBetaGamma999";
        auditService.record(auth, AuditAction.PRODUCT_UPDATED, AuditTargetType.PRODUCT, "PROD-12345", "Special chemical update: " + uniqueMarker, "10.20.30.40");
        auditService.record(auth, AuditAction.PRODUCT_DELETED, AuditTargetType.PRODUCT, "PROD-67890", "Deleted standard chemical", "10.20.30.41");

        mockMvc.perform(get("/api/v1/admin/audit?query=" + uniqueMarker)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].details", containsString(uniqueMarker)));

        mockMvc.perform(get("/api/v1/admin/audit?query=PROD-67890")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].targetId", is("PROD-67890")));
    }

    @Test
    @DisplayName("Pagination bounds: Size is constrained between 1 and 100")
    public void testPaginationBounds() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        for (int i = 0; i < 5; i++) {
            auditService.record(auth, AuditAction.USER_ROLE_CHANGED, AuditTargetType.USER, "USR-" + i, "Batch " + i, "127.0.0.1");
        }

        mockMvc.perform(get("/api/v1/admin/audit?page=0&size=2")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(2)))
                .andExpect(jsonPath("$.content", hasSize(2)));

        // Requesting excessive size (e.g. 500) is clamped to 100
        mockMvc.perform(get("/api/v1/admin/audit?page=0&size=500")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size", is(100)));
    }

    // =========================================================================
    // 5. Sensitive Data Hygiene
    // =========================================================================

    @Test
    @DisplayName("Sensitive data: Passwords, password hashes, JWT tokens, reset tokens are NEVER present in audit records")
    public void testSensitiveDataExcluded() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        auditService.record(
                auth,
                AuditAction.USER_SUSPENDED,
                AuditTargetType.USER,
                regularBuyer.getId().toString(),
                "Account suspended due to policy infraction",
                "127.0.0.1"
        );

        String responseBody = mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Verify none of the sensitive strings are present
        assertFalse(responseBody.toLowerCase().contains("passwordhash"));
        assertFalse(responseBody.toLowerCase().contains("secureadminpassword123!"));
        assertFalse(responseBody.toLowerCase().contains("secret"));
        assertFalse(responseBody.toLowerCase().contains("bearertoken"));
        assertFalse(responseBody.toLowerCase().contains("refreshtoken"));
    }

    // =========================================================================
    // 6. Newly Introduced Audit Actions
    // =========================================================================

    @Test
    @DisplayName("AuditAction taxonomy: All new Phase 1.12 actions can be recorded and queried")
    public void testNewAuditActions() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        auditService.record(auth, AuditAction.MASTER_PRODUCT_CREATED, AuditTargetType.MASTER_PRODUCT, UUID.randomUUID().toString(), "Created master chemical", "127.0.0.1");
        auditService.record(auth, AuditAction.MASTER_PRODUCT_ACTIVATED, AuditTargetType.MASTER_PRODUCT, UUID.randomUUID().toString(), "Activated master chemical", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_OFFERING_CREATED_BY_ADMIN, AuditTargetType.SUPPLIER_OFFERING, UUID.randomUUID().toString(), "Admin listed offering", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_OFFERING_UPDATED, AuditTargetType.SUPPLIER_OFFERING, UUID.randomUUID().toString(), "Updated commercial price", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_OFFERING_ACTIVATED, AuditTargetType.SUPPLIER_OFFERING, UUID.randomUUID().toString(), "Activated offering", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_OFFERING_DEACTIVATED, AuditTargetType.SUPPLIER_OFFERING, UUID.randomUUID().toString(), "Deactivated offering", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_REVIEW_STARTED, AuditTargetType.SUPPLIER, UUID.randomUUID().toString(), "Review started", "127.0.0.1");
        auditService.record(auth, AuditAction.SUPPLIER_EVIDENCE_UPDATED, AuditTargetType.SUPPLIER, UUID.randomUUID().toString(), "Evidence approved", "127.0.0.1");
        auditService.record(auth, AuditAction.APPEAL_INFORMATION_RESPONDED, AuditTargetType.ACCOUNT_SUSPENSION_APPEAL, UUID.randomUUID().toString(), "User uploaded KYC", "127.0.0.1");

        mockMvc.perform(get("/api/v1/admin/audit?action=MASTER_PRODUCT_CREATED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].action", is("MASTER_PRODUCT_CREATED")));

        mockMvc.perform(get("/api/v1/admin/audit?action=APPEAL_INFORMATION_RESPONDED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].action", is("APPEAL_INFORMATION_RESPONDED")));

        mockMvc.perform(get("/api/v1/admin/audit/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents", greaterThanOrEqualTo(9)))
                .andExpect(jsonPath("$.todayEvents", greaterThanOrEqualTo(9)))
                .andExpect(jsonPath("$.catalogGovernanceEvents", greaterThanOrEqualTo(6)))
                .andExpect(jsonPath("$.supplierGovernanceEvents", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.userGovernanceEvents", greaterThanOrEqualTo(1)));
    }
}
