package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JwtSecurityHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User testBuyer;
    private User testSupplier;
    private User testAdmin;
    private User suspendedUser;
    private User deletedUser;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        testBuyer = new User();
        testBuyer.setName("Test Buyer");
        testBuyer.setEmail("buyer@synthora.com");
        testBuyer.setPasswordHash(passwordEncoder.encode("Password123!"));
        testBuyer.setRole(UserRole.USER);
        testBuyer.setStatus(UserStatus.ACTIVE);
        testBuyer.setEmailVerifiedAt(Instant.now());
        testBuyer = userRepository.save(testBuyer);

        testSupplier = new User();
        testSupplier.setName("Test Supplier");
        testSupplier.setEmail("supplier@synthora.com");
        testSupplier.setPasswordHash(passwordEncoder.encode("Password123!"));
        testSupplier.setRole(UserRole.SUPPLIER);
        testSupplier.setStatus(UserStatus.ACTIVE);
        testSupplier.setEmailVerifiedAt(Instant.now());
        testSupplier = userRepository.save(testSupplier);

        testAdmin = new User();
        testAdmin.setName("Test Admin");
        testAdmin.setEmail("admin@synthora.com");
        testAdmin.setPasswordHash(passwordEncoder.encode("Password123!"));
        testAdmin.setRole(UserRole.ADMIN);
        testAdmin.setStatus(UserStatus.ACTIVE);
        testAdmin.setEmailVerifiedAt(Instant.now());
        testAdmin = userRepository.save(testAdmin);

        suspendedUser = new User();
        suspendedUser.setName("Suspended User");
        suspendedUser.setEmail("suspended@synthora.com");
        suspendedUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser.setEmailVerifiedAt(Instant.now());
        suspendedUser = userRepository.save(suspendedUser);

        deletedUser = new User();
        deletedUser.setName("Deleted User");
        deletedUser.setEmail("deleted@synthora.com");
        deletedUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        deletedUser.setRole(UserRole.USER);
        deletedUser.setStatus(UserStatus.ACTIVE);
        deletedUser.setDeletedAt(Instant.now());
        deletedUser.setEmailVerifiedAt(Instant.now());
        deletedUser = userRepository.save(deletedUser);
    }

    @Test
    @DisplayName("Valid JWT grants authenticated access to user endpoint")
    void testValidJwtAllowsAccess() throws Exception {
        String token = jwtService.generateToken(testBuyer);

        assertTrue(jwtService.isTokenValid(token));
        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("buyer@synthora.com")))
                .andExpect(jsonPath("$.role", is("USER")));
    }

    @Test
    @DisplayName("Expired JWT is rejected with HTTP 401 Unauthorized")
    void testExpiredJwtIsRejected() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor("SynthoraDevSecretKeyForJwtSigning2026!".getBytes(StandardCharsets.UTF_8));
        String expiredToken = Jwts.builder()
                .issuer("kemkendra")
                .subject("buyer@synthora.com")
                .claim("role", "USER")
                .issuedAt(new Date(System.currentTimeMillis() - 3600000))
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(key)
                .compact();

        assertFalse(jwtService.isTokenValid(expiredToken));

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("JWT signed with untrusted secret key is rejected with HTTP 401")
    void testUntrustedKeyJwtIsRejected() throws Exception {
        SecretKey forgedKey = Keys.hmacShaKeyFor("UntrustedAttackerSecretKeyForSigning2026!".getBytes(StandardCharsets.UTF_8));
        String forgedToken = Jwts.builder()
                .issuer("kemkendra")
                .subject("buyer@synthora.com")
                .claim("role", "ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(forgedKey)
                .compact();

        assertFalse(jwtService.isTokenValid(forgedToken));

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Tampered JWT payload is rejected with HTTP 401")
    void testTamperedPayloadIsRejected() throws Exception {
        String validToken = jwtService.generateToken(testBuyer);
        String[] parts = validToken.split("\\.");
        // Modify payload to forge admin email
        String tamperedToken = parts[0] + ".eyJzdWIiOiJhZG1pbkBzeW50aG9yYS5jb20iLCJyb2xlIjoiQURNSU4ifQ." + parts[2];

        assertFalse(jwtService.isTokenValid(tamperedToken));

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Empty, malformed, and missing Bearer tokens are rejected with HTTP 401")
    void testMalformedTokensRejected() throws Exception {
        assertFalse(jwtService.isTokenValid(null));
        assertFalse(jwtService.isTokenValid(""));
        assertFalse(jwtService.isTokenValid("   "));
        assertFalse(jwtService.isTokenValid("invalid.token.structure"));

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer "))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer gibberish_token_data"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Client cannot elevate privileges by tampering with JWT role claim")
    void testPrivilegeEscalationDefense() throws Exception {
        // Even if a buyer's token is signed, JwtAuthenticationFilter loads the real authority from DB
        String buyerToken = jwtService.generateToken(testBuyer);

        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("SUPPLIER role receives HTTP 403 Forbidden on ADMIN endpoints")
    void testSupplierForbiddenOnAdminEndpoints() throws Exception {
        String supplierToken = jwtService.generateToken(testSupplier);

        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("ADMIN role is granted access to ADMIN endpoints")
    void testAdminAllowedOnAdminEndpoints() throws Exception {
        String adminToken = jwtService.generateToken(testAdmin);

        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Suspended user with valid JWT is blocked from API access")
    void testSuspendedUserBlockedWithValidJwt() throws Exception {
        String token = jwtService.generateToken(suspendedUser);

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Soft-deleted user with valid JWT is blocked from API access")
    void testDeletedUserBlockedWithValidJwt() throws Exception {
        String token = jwtService.generateToken(deletedUser);

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}
