package com.kemkendra.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.identity.dto.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import io.jsonwebtoken.Jwts;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthenticationSecurityHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LoginRateLimiterService rateLimiterService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.kemkendra.identity.service.PasswordResetService passwordResetService;

    @Autowired
    private com.kemkendra.identity.PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private com.kemkendra.identity.service.UserService userService;

    private User activeUser;
    private User suspendedUser;
    private User deletedUser;
    private User adminUser;
    private User supplierUser;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        activeUser = new User();
        activeUser.setName("Active User");
        activeUser.setEmail("active@kemkendra.com");
        activeUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        activeUser.setRole(UserRole.USER);
        activeUser.setStatus(UserStatus.ACTIVE);
        activeUser.setEmailVerifiedAt(Instant.now());
        activeUser = userRepository.save(activeUser);

        suspendedUser = new User();
        suspendedUser.setName("Suspended User");
        suspendedUser.setEmail("suspended@kemkendra.com");
        suspendedUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser.setEmailVerifiedAt(Instant.now());
        suspendedUser = userRepository.save(suspendedUser);

        deletedUser = new User();
        deletedUser.setName("Deleted User");
        deletedUser.setEmail("deleted@kemkendra.com");
        deletedUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        deletedUser.setRole(UserRole.USER);
        deletedUser.setStatus(UserStatus.ACTIVE);
        deletedUser.setEmailVerifiedAt(Instant.now());
        deletedUser.setDeletedAt(Instant.now());
        deletedUser = userRepository.save(deletedUser);

        adminUser = new User();
        adminUser.setName("Admin User");
        adminUser.setEmail("admin@kemkendra.com");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);

        supplierUser = new User();
        supplierUser.setName("Supplier User");
        supplierUser.setEmail("supplier@kemkendra.com");
        supplierUser.setPasswordHash(passwordEncoder.encode("SupplierPass123!"));
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setEmailVerifiedAt(Instant.now());
        supplierUser = userRepository.save(supplierUser);
    }

    @Test
    @DisplayName("Valid login returns 200 with JWT token")
    public void testValidLogin() throws Exception {
        LoginRequest request = new LoginRequest("active@kemkendra.com", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Login successful")))
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    @DisplayName("Login with wrong password returns 400 with generic error message")
    public void testLoginWrongPassword() throws Exception {
        LoginRequest request = new LoginRequest("active@kemkendra.com", "WrongPassword!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Login with nonexistent email returns identical generic 400 error")
    public void testLoginUnknownEmail() throws Exception {
        LoginRequest request = new LoginRequest("unknown@kemkendra.com", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Login with suspended user returns suspension notice and restricted token for appeals")
    public void testLoginSuspendedUser() throws Exception {
        LoginRequest request = new LoginRequest("suspended@kemkendra.com", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Your KemKendra account is currently suspended")))
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("Login with deleted user returns identical generic 400 error")
    public void testLoginDeletedUser() throws Exception {
        LoginRequest request = new LoginRequest("deleted@kemkendra.com", "Password123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Active user with valid JWT can access protected /api/v1/users/me")
    public void testActiveUserWithValidJwt() throws Exception {
        String token = jwtService.generateToken(activeUser);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("active@kemkendra.com")));
    }

    @Test
    @DisplayName("Suspended user with valid JWT receives 401 on protected endpoint")
    public void testSuspendedUserBlockedByJwtFilter() throws Exception {
        String token = jwtService.generateToken(suspendedUser);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Deleted user with valid JWT receives 401 on protected endpoint")
    public void testDeletedUserBlockedByJwtFilter() throws Exception {
        String token = jwtService.generateToken(deletedUser);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Expired JWT token receives 401 Unauthorized")
    public void testExpiredTokenRejected() throws Exception {
        String expiredToken = Jwts.builder()
                .subject("active@kemkendra.com")
                .claim("role", "USER")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        "KemKendraSuperSecretKeyForJwtSigningMustBeAtLeast256BitsLong!".getBytes(StandardCharsets.UTF_8)))
                .compact();

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Tampered JWT signature receives 401 Unauthorized")
    public void testTamperedTokenRejected() throws Exception {
        String validToken = jwtService.generateToken(activeUser);
        String[] parts = validToken.split("\\.");
        String tamperedToken = parts[0] + ".eyJzdWIiOiJhZG1pbkBzeW50aG9yYS5jb20iLCJyb2xlIjoiQURNSU4ifQ." + parts[2];

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Nonexistent user in signed JWT is rejected with 401")
    public void testNonexistentUserWithJwtIsRejected() throws Exception {
        User ghostUser = new User();
        ghostUser.setEmail("ghost@kemkendra.com");
        ghostUser.setRole(UserRole.USER);
        String token = jwtService.generateToken(ghostUser);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("Malformed JWT is rejected with 401")
    public void testMalformedJwtIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer invalid.jwt.token.here"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("Missing Authorization header is rejected with 401")
    public void testMissingAuthorizationHeaderIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("USER role is rejected with 403 when calling ADMIN endpoints")
    public void testUserCannotAccessAdminEndpoint() throws Exception {
        String token = jwtService.generateToken(activeUser);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SUPPLIER role is rejected with 403 when calling ADMIN endpoints")
    public void testSupplierCannotAccessAdminEndpoint() throws Exception {
        String token = jwtService.generateToken(supplierUser);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN role is allowed on ADMIN endpoints")
    public void testAdminCanAccessAdminEndpoint() throws Exception {
        String token = jwtService.generateToken(adminUser);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("5 consecutive failed login attempts trigger 429 Too Many Requests")
    public void testRateLimitingOnFailedLogins() throws Exception {
        String bruteForceEmail = "bruteforce_" + UUID.randomUUID() + "@kemkendra.com";
        LoginRequest badRequest = new LoginRequest(bruteForceEmail, "WrongPass");

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .header("X-Forwarded-For", "192.168.1.100")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badRequest)))
                    .andExpect(status().isBadRequest());
        }

        // 6th attempt must trigger HTTP 429
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "192.168.1.100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Too many failed login attempts")));
    }

    @Test
    @DisplayName("Failed attempts on different accounts on shared IP do not cause premature false-positive lockout")
    public void testSharedIpMultiAccountRateLimitIsolation() throws Exception {
        String sharedIp = "10.0.0.50";

        // User A fails 2 times
        String userA = "user_a_" + UUID.randomUUID() + "@kemkendra.com";
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .header("X-Forwarded-For", sharedIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new LoginRequest(userA, "BadPass"))))
                    .andExpect(status().isBadRequest());
        }

        // User B on the same IP must NOT be blocked on their 1st attempt
        String userB = "user_b_" + UUID.randomUUID() + "@kemkendra.com";
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", sharedIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(userB, "BadPass"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("C1.1: Valid JWT supplied only as ?token= query parameter is rejected with 401")
    public void testJwtInQueryParameterRejected() throws Exception {
        String token = jwtService.generateToken(activeUser);

        mockMvc.perform(get("/api/v1/users/me?token=" + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("C1.1: When both Authorization header and ?token= query parameter exist, only header is used")
    public void testJwtInBothAuthorizationAndQueryParameterUsesAuthorizationHeaderOnly() throws Exception {
        String validToken = jwtService.generateToken(activeUser);
        String bogusQueryToken = "bogus_malicious_query_parameter_token";

        mockMvc.perform(get("/api/v1/users/me?token=" + bogusQueryToken)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("active@kemkendra.com")));
    }

    @Test
    @DisplayName("C1.4: JWT signed with wrong issuer is rejected with 401 Unauthorized")
    public void testJwtWrongIssuerRejected() throws Exception {
        io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                "KemKendraSuperSecretKeyForJwtSigningMustBeAtLeast256BitsLong!".getBytes(StandardCharsets.UTF_8));

        String wrongIssuerToken = Jwts.builder()
                .issuer("untrusted-foreign-issuer")
                .subject("active@kemkendra.com")
                .claim("role", "USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        "KemKendraSuperSecretKeyForJwtSigningMustBeAtLeast256BitsLong!".getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertFalse(jwtService.isTokenValid(wrongIssuerToken));

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + wrongIssuerToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C1.4: JWT with correct issuer 'kemkendra' is accepted")
    public void testJwtCorrectIssuerAccepted() throws Exception {
        String token = jwtService.generateToken(activeUser);

        assertTrue(jwtService.isTokenValid(token));
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("active@kemkendra.com")));
    }

    @Test
    @DisplayName("C1.3: Newly generated JWT contains unique jti claim")
    public void testNewlyGeneratedJwtContainsJti() throws Exception {
        String token1 = jwtService.generateToken(activeUser);
        String token2 = jwtService.generateToken(activeUser);

        String jti1 = jwtService.extractJti(token1);
        String jti2 = jwtService.extractJti(token2);

        org.junit.jupiter.api.Assertions.assertNotNull(jti1);
        org.junit.jupiter.api.Assertions.assertNotNull(jti2);
        org.junit.jupiter.api.Assertions.assertFalse(jti1.isBlank());
        org.junit.jupiter.api.Assertions.assertNotEquals(jti1, jti2);
        // Verify UUID format
        UUID.fromString(jti1);
        UUID.fromString(jti2);
    }

    @Test
    @DisplayName("C1.2: Password reset updates passwordChangedAt and invalidates pre-existing JWTs")
    public void testPasswordResetUpdatesPasswordChangedAtAndInvalidatesPreExistingJwt() throws Exception {
        // 1. Issue initial valid token
        String oldToken = jwtService.generateToken(activeUser);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isOk());

        // 2. Trigger forgot password
        passwordResetService.processForgotPassword(new com.kemkendra.identity.dto.ForgotPasswordRequest("active@kemkendra.com"));

        // Retrieve raw token from test-saved token entity
        com.kemkendra.identity.PasswordResetToken resetToken = passwordResetTokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(activeUser.getId()))
                .findFirst()
                .orElseThrow();

        // Use custom raw token simulation: generate fresh token to reset
        byte[] rawBytes = new byte[32];
        java.security.SecureRandom random = new java.security.SecureRandom();
        random.nextBytes(rawBytes);
        String rawToken = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);
        resetToken.setTokenHash(com.kemkendra.identity.service.PasswordResetService.hashToken(rawToken));
        passwordResetTokenRepository.save(resetToken);

        // 3. Reset password
        passwordResetService.resetPassword(new com.kemkendra.identity.dto.ResetPasswordRequest(rawToken, "NewPassword123!"));

        // Reload user from database
        User updatedUser = userRepository.findByEmail("active@kemkendra.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotNull(updatedUser.getPasswordChangedAt());

        // 4. Old token issued before password change MUST be rejected with HTTP 401
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized());

        // 5. Newly issued token after password change MUST be accepted with HTTP 200
        String newToken = jwtService.generateToken(updatedUser);
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("active@kemkendra.com")));
    }

    @Test
    @DisplayName("C1.2: Authenticated changePassword updates passwordChangedAt and invalidates pre-existing JWTs")
    public void testPasswordChangeViaUserServiceInvalidatesPreExistingJwt() throws Exception {
        String oldToken = jwtService.generateToken(activeUser);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isOk());

        // Change password while authenticated
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        activeUser.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));

        userService.changePassword(auth, new com.kemkendra.identity.dto.ChangePasswordRequest("Password123!", "NewChangedPass123!"));

        User updatedUser = userRepository.findByEmail("active@kemkendra.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotNull(updatedUser.getPasswordChangedAt());

        // Old token must be rejected
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized());

        // New token must be accepted
        String newToken = jwtService.generateToken(updatedUser);
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("C1.5: PENDING user can authenticate for profile/onboarding but is blocked from commercial RFQs")
    public void testPendingUserCanAccessProfileButBlockedFromCommercialTransactions() throws Exception {
        User pendingUser = new User();
        pendingUser.setName("Pending User");
        pendingUser.setEmail("pending@kemkendra.com");
        pendingUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        pendingUser.setRole(UserRole.USER);
        pendingUser.setStatus(UserStatus.PENDING);
        pendingUser.setEmailVerifiedAt(Instant.now());
        pendingUser = userRepository.save(pendingUser);

        String pendingToken = jwtService.generateToken(pendingUser);

        // Can access /users/me for onboarding & identity inspection
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + pendingToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PENDING")));

        // Attempting to submit an RFQ must be rejected because status is not ACTIVE
        com.kemkendra.rfq.dto.CreateRfqRequest rfqRequest = new com.kemkendra.rfq.dto.CreateRfqRequest(
                UUID.randomUUID(), 1L, new java.math.BigDecimal("100"), "KG", "Test RFQ Message");

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + pendingToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rfqRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_STATE_TRANSITION")))
                .andExpect(jsonPath("$.message", containsString("Buyer account is not active.")));
    }
}
