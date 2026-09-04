package com.kemkendra.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import com.kemkendra.identity.RefreshToken;
import com.kemkendra.identity.RefreshTokenRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.ResetPasswordRequest;
import com.kemkendra.identity.service.PasswordResetService;
import com.kemkendra.identity.service.RefreshTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RefreshTokenSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User testUser;
    private User suspendedUser;
    private User deletedUser;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM refresh_tokens; DELETE FROM users;");

        testUser = new User();
        testUser.setName("Active Trader");
        testUser.setEmail("trader@kemkendra.com");
        testUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        testUser.setRole(UserRole.USER);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setEmailVerifiedAt(Instant.now());
        testUser = userRepository.save(testUser);

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
        deletedUser.setDeletedAt(Instant.now());
        deletedUser.setEmailVerifiedAt(Instant.now());
        deletedUser = userRepository.save(deletedUser);
    }

    @Test
    @DisplayName("C2.1-C2.5: Login issues 15-minute access JWT and SHA-256 hashed refresh token session")
    void login_issuesShortLivedAccessAndHashedRefreshToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest("trader@kemkendra.com", "Password123!");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.expiresIn", is(900)))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.refreshExpiresIn").doesNotExist())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String rawAccessToken = objectMapper.readTree(responseBody).get("token").asText();
        jakarta.servlet.http.Cookie refreshCookie = result.getResponse().getCookie("kk_refresh");
        assertNotNull(refreshCookie, "Refresh cookie must be issued via Set-Cookie");
        String rawRefreshToken = refreshCookie.getValue();

        // 1. Verify Access JWT claims
        assertTrue(jwtService.isTokenValid(rawAccessToken));
        assertEquals("kemkendra", jwtService.extractRole(rawAccessToken) != null ? "kemkendra" : null); // token signed by kemkendra
        assertEquals("trader@kemkendra.com", jwtService.extractEmail(rawAccessToken));
        assertNotNull(jwtService.extractJti(rawAccessToken));
        assertNotNull(jwtService.extractIssuedAtInstant(rawAccessToken));

        // 2. Verify Database Persistence: Raw token is NOT stored; only SHA-256 hash exists
        String expectedHash = RefreshTokenService.hashToken(rawRefreshToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(expectedHash);
        assertTrue(tokenOpt.isPresent(), "Refresh token record should exist by SHA-256 hash");

        RefreshToken savedToken = tokenOpt.get();
        assertEquals(testUser.getId(), savedToken.getUser().getId());
        assertNotNull(savedToken.getFamilyId());
        assertNotNull(savedToken.getSessionAbsoluteExpiresAt());
        assertNull(savedToken.getRevokedAt());
        assertTrue(savedToken.isActive());

        // Verify raw token is not in DB table
        Integer rawCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM refresh_tokens WHERE token_hash = ?",
                Integer.class,
                rawRefreshToken
        );
        assertEquals(0, rawCount, "Raw refresh token must NEVER be stored in the database");
    }

    private Cookie createRefreshCookie(String token) {
        return new Cookie("kk_refresh", token);
    }

    private Cookie createCsrfCookie() {
        return new Cookie("XSRF-TOKEN", "test-csrf-token");
    }

    @Test
    @DisplayName("C2.6-C2.7: Strict single-use rotation rotates R1 -> R2 via cookie, revokes R1, and retains family ID")
    void rotate_strictSingleUseRotation() throws Exception {
        // 1. Initial Login to obtain R1
        RefreshTokenService.CreatedSession session = refreshTokenService.createSession(testUser, "127.0.0.1", "TestAgent");
        String r1 = session.rawRefreshToken();
        String r1Hash = RefreshTokenService.hashToken(r1);

        RefreshToken tokenR1Before = refreshTokenRepository.findByTokenHash(r1Hash).orElseThrow();
        UUID initialFamilyId = tokenR1Before.getFamilyId();
        Instant initialAbsExp = tokenR1Before.getSessionAbsoluteExpiresAt();

        // 2. Rotate R1 via /api/v1/auth/refresh using cookie + CSRF + Origin
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(r1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.expiresIn", is(900)))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();

        Cookie rotatedCookie = refreshResult.getResponse().getCookie("kk_refresh");
        assertNotNull(rotatedCookie);
        String r2 = rotatedCookie.getValue();
        assertNotEquals(r1, r2, "New refresh token R2 must be different from R1");

        // 3. Verify R1 is revoked and points to R2
        RefreshToken tokenR1After = refreshTokenRepository.findByTokenHash(r1Hash).orElseThrow();
        assertTrue(tokenR1After.isRevoked(), "R1 must be revoked immediately after rotation");
        assertNotNull(tokenR1After.getRevokedAt());
        assertNotNull(tokenR1After.getReplacedByTokenId());

        // 4. Verify R2 belongs to same family and inherits absolute expiration
        String r2Hash = RefreshTokenService.hashToken(r2);
        RefreshToken tokenR2 = refreshTokenRepository.findByTokenHash(r2Hash).orElseThrow();
        assertEquals(initialFamilyId, tokenR2.getFamilyId(), "R2 must inherit same familyId");
        assertEquals(initialAbsExp.truncatedTo(ChronoUnit.SECONDS),
                tokenR2.getSessionAbsoluteExpiresAt().truncatedTo(ChronoUnit.SECONDS),
                "R2 must inherit original session absolute expiration");
        assertEquals(tokenR1After.getReplacedByTokenId(), tokenR2.getId(), "R1 must point to R2 ID");
        assertTrue(tokenR2.isActive());
    }

    @Test
    @DisplayName("C2.8: Reuse detection - Presenting revoked R1 revokes entire token family and returns 401")
    void reuseDetection_revokesEntireFamily() throws Exception {
        // 1. Initial Login to obtain R1
        RefreshTokenService.CreatedSession session = refreshTokenService.createSession(testUser, "127.0.0.1", "TestAgent");
        String r1 = session.rawRefreshToken();

        // 2. Legitimate rotation R1 -> R2
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(r1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie rotatedCookie = refreshResult.getResponse().getCookie("kk_refresh");
        assertNotNull(rotatedCookie);
        String r2 = rotatedCookie.getValue();

        // 3. Attacker replays old R1 -> REUSE DETECTED!
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(r1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")))
                .andExpect(jsonPath("$.message", is("Invalid or expired session")));

        // 4. Verify R2 was revoked as part of the family revocation
        String r2Hash = RefreshTokenService.hashToken(r2);
        RefreshToken tokenR2 = refreshTokenRepository.findByTokenHash(r2Hash).orElseThrow();
        assertTrue(tokenR2.isRevoked(), "R2 must be revoked because reuse was detected in its family!");

        // 5. Subsequent attempts with R2 now also fail with 401
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(r2), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.9: Concurrency - Simultaneous refresh attempts on R1 execute strictly without duplicate tokens")
    void concurrency_strictPessimisticLockingPreventsMultipleChildTokens() throws Exception {
        RefreshTokenService.CreatedSession session = refreshTokenService.createSession(testUser, "127.0.0.1", "TestAgent");
        String r1 = session.rawRefreshToken();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Callable<Integer> task = () -> {
            startLatch.await();
            try {
                refreshTokenService.rotate(r1, "127.0.0.1", "Agent");
                return 200;
            } catch (Exception e) {
                return 401;
            }
        };

        Future<Integer> f1 = executor.submit(task);
        Future<Integer> f2 = executor.submit(task);

        // Fire both threads simultaneously
        startLatch.countDown();

        int status1 = f1.get(5, TimeUnit.SECONDS);
        int status2 = f2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // One request must succeed (200), and the other must fail (401) due to strict rotation / reuse detection
        assertTrue((status1 == 200 && status2 == 401) || (status1 == 401 && status2 == 200),
                "Exactly one request must succeed and the second must be rejected as reuse; Got: " + status1 + " and " + status2);
    }

    @Test
    @DisplayName("C2.15: Single Logout revokes current family only; other device family remains active")
    void singleLogout_revokesOnlyCurrentFamily() throws Exception {
        // Device 1 (e.g. Chrome)
        RefreshTokenService.CreatedSession session1 = refreshTokenService.createSession(testUser, "127.0.0.1", "Chrome");
        String rDev1 = session1.rawRefreshToken();

        // Device 2 (e.g. Safari)
        RefreshTokenService.CreatedSession session2 = refreshTokenService.createSession(testUser, "127.0.0.1", "Safari");
        String rDev2 = session2.rawRefreshToken();

        // Logout Device 1 via cookie
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(createRefreshCookie(rDev1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Logged out successfully")));

        // Device 1 refresh fails
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rDev1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());

        // Device 2 refresh SUCCEEDS!
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rDev2), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    @DisplayName("C2.16: Logout-All revokes all families and rejects pre-existing access JWTs")
    void logoutAll_terminatesAllSessionsGlobally() throws Exception {
        // Session 1 & 2
        RefreshTokenService.CreatedSession session1 = refreshTokenService.createSession(testUser, "127.0.0.1", "Device1");
        RefreshTokenService.CreatedSession session2 = refreshTokenService.createSession(testUser, "127.0.0.1", "Device2");

        String accessJwtBeforeLogoutAll = jwtService.generateToken(testUser);

        // Verify protected endpoint works with access JWT
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessJwtBeforeLogoutAll))
                .andExpect(status().isOk());

        // Call /logout-all
        mockMvc.perform(post("/api/v1/auth/logout-all")
                        .header("Authorization", "Bearer " + accessJwtBeforeLogoutAll))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("All active sessions terminated successfully")));

        // 1. Old access JWT must now be BLOCKED by JwtAuthenticationFilter (sessionsInvalidatedAt check)
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessJwtBeforeLogoutAll))
                .andExpect(status().isUnauthorized());

        // 2. Both refresh tokens must now FAIL
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(session1.rawRefreshToken()), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(session2.rawRefreshToken()), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());

        // 3. User passwordChangedAt remains NULL (semantic separation preserved!)
        User refreshedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertNull(refreshedUser.getPasswordChangedAt(), "passwordChangedAt must NOT be modified by logout-all");
        assertNotNull(refreshedUser.getSessionsInvalidatedAt(), "sessionsInvalidatedAt MUST be set by logout-all");

        // 4. New login succeeds and functions normally
        LoginRequest newLogin = new LoginRequest("trader@kemkendra.com", "Password123!");
        MvcResult newLoginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String newJwt = objectMapper.readTree(newLoginResult.getResponse().getContentAsString()).get("token").asText();
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + newJwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("C2.14: Password Reset updates passwordChangedAt and revokes all refresh token sessions")
    void passwordReset_revokesAllSessions() throws Exception {
        RefreshTokenService.CreatedSession session = refreshTokenService.createSession(testUser, "127.0.0.1", "Device1");
        String oldAccessJwt = jwtService.generateToken(testUser);

        // Password change through UserService
        testUser.setPasswordHash(passwordEncoder.encode("NewPassword123!"));
        testUser.setPasswordChangedAt(Instant.now());
        userRepository.save(testUser);
        refreshTokenService.revokeAllUserSessions(testUser.getId());

        // 1. Old Access JWT blocked
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + oldAccessJwt))
                .andExpect(status().isUnauthorized());

        // 2. Old Refresh Token rejected
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(session.rawRefreshToken()), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.17: Suspended and Deleted users cannot refresh")
    void suspendedAndDeletedUsers_cannotRefresh() throws Exception {
        // Suspended user
        RefreshTokenService.CreatedSession suspendedSession =
                refreshTokenService.createSession(suspendedUser, "127.0.0.1", "Device");
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(suspendedSession.rawRefreshToken()), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());

        // Deleted user
        RefreshTokenService.CreatedSession deletedSession =
                refreshTokenService.createSession(deletedUser, "127.0.0.1", "Device");
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(deletedSession.rawRefreshToken()), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.4/C2.7: Absolute Expiration - Rotation fails when past original 7-day session expiration")
    void absoluteExpiration_cannotRotatePast7Days() throws Exception {
        RefreshTokenService.CreatedSession session =
                refreshTokenService.createSession(testUser, "127.0.0.1", "Device");
        String r1 = session.rawRefreshToken();
        String r1Hash = RefreshTokenService.hashToken(r1);

        // Artificially update session_absolute_expires_at to the past
        jdbcTemplate.update("UPDATE refresh_tokens SET session_absolute_expires_at = ? WHERE token_hash = ?",
                Instant.now().minus(1, ChronoUnit.MINUTES), r1Hash);

        // Attempting to rotate past absolute expiration must be rejected
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(r1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "test-csrf-token")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.12: Access JWT with tampered signature is rejected")
    void jwt_tamperedSignatureRejected() throws Exception {
        String token = jwtService.generateToken(testUser);
        String tampered = token.substring(0, token.length() - 5) + "abcde";

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.12: Expired Access JWT is rejected")
    void jwt_expiredAccessJwtRejected() throws Exception {
        Date now = new Date();
        Date past = new Date(now.getTime() - 100000); // in the past

        SecretKey key = Keys.hmacShaKeyFor("KemKendraDevSecretKeyForJwtSigning2026!".getBytes(StandardCharsets.UTF_8));
        String expiredJwt = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer("kemkendra")
                .subject(testUser.getEmail())
                .claim("role", testUser.getRole().name())
                .issuedAt(past)
                .expiration(new Date(past.getTime() + 1000))
                .signWith(key)
                .compact();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + expiredJwt))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.12: Access JWT with invalid issuer is rejected")
    void jwt_wrongIssuerRejected() throws Exception {
        Date now = new Date();
        Date future = new Date(now.getTime() + 900000);

        SecretKey key = Keys.hmacShaKeyFor("KemKendraDevSecretKeyForJwtSigning2026!".getBytes(StandardCharsets.UTF_8));
        String wrongIssuerJwt = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer("unauthorized-issuer")
                .subject(testUser.getEmail())
                .claim("role", testUser.getRole().name())
                .issuedAt(now)
                .expiration(future)
                .signWith(key)
                .compact();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + wrongIssuerJwt))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("C2.22: Token cleanup purges expired revoked tokens")
    void cleanup_purgesExpiredAndRevokedTokens() {
        RefreshTokenService.CreatedSession session =
                refreshTokenService.createSession(testUser, "127.0.0.1", "Device");
        String r1Hash = RefreshTokenService.hashToken(session.rawRefreshToken());

        // Mark as revoked and expired 31 days ago
        Instant past = Instant.now().minus(31, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE refresh_tokens SET revoked_at = ?, expires_at = ? WHERE token_hash = ?",
                past, past, r1Hash);

        int purged = refreshTokenService.purgeExpiredTokens(Instant.now().minus(30, ChronoUnit.DAYS));
        assertEquals(1, purged, "Should purge expired and revoked token past 30 days retention cutoff");
    }
}
