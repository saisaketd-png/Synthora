package com.kemkendra.security.cookie;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.RefreshToken;
import com.kemkendra.identity.RefreshTokenRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.service.RefreshTokenService;
import com.kemkendra.security.JwtService;
import com.kemkendra.security.LoginRateLimiterService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RefreshAndLogoutCookieIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LoginRateLimiterService rateLimiterService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    private static final String TEST_PASSWORD = "StrongSecurePassword123!";
    private static final String VALID_ORIGIN = "http://localhost:3000";
    private static final String CSRF_TOKEN = "test-valid-csrf-token-12345";
    private User testUser;
    private User suspendedUser;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        testUser = new User();
        testUser.setEmail("c3d_refresh_user@kemkendra.com");
        testUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        testUser.setName("C3D Refresh User");
        testUser.setRole(UserRole.USER);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setEmailVerifiedAt(Instant.now());
        testUser = userRepository.save(testUser);

        suspendedUser = new User();
        suspendedUser.setEmail("c3d_suspended_user@kemkendra.com");
        suspendedUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        suspendedUser.setName("C3D Suspended User");
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser.setEmailVerifiedAt(Instant.now());
        suspendedUser = userRepository.save(suspendedUser);
    }

    private Cookie createCsrfCookie() {
        return new Cookie("XSRF-TOKEN", CSRF_TOKEN);
    }

    private Cookie createRefreshCookie(String rawToken) {
        return new Cookie("kk_refresh", rawToken);
    }

    private String doLoginAndExtractRefreshCookie() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testUser.getEmail(), TEST_PASSWORD);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNotNull();
        return refreshCookie.getValue();
    }

    // ==========================================
    // A. REFRESH COOKIE TESTS
    // ==========================================

    @Test
    @DisplayName("1-6. Login sets cookie, and Refresh succeeds using ONLY cookie (empty body) returning access JWT without refreshToken in JSON")
    void refreshSucceedsUsingOnlyCookie() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        // Perform refresh using ONLY the cookie, empty request body, valid CSRF & Origin
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.expiresIn").isNumber())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.refreshExpiresIn").doesNotExist())
                .andReturn();

        String json = refreshResult.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(json);
        assertThat(jsonNode.has("refreshToken")).isFalse();
        assertThat(json.toLowerCase()).doesNotContain("refresh");

        // Verify Set-Cookie header contains replacement rotated refresh token
        Cookie replacementCookie = refreshResult.getResponse().getCookie("kk_refresh");
        assertThat(replacementCookie).isNotNull();
        assertThat(replacementCookie.getValue()).isNotBlank();
        assertThat(replacementCookie.getValue()).isNotEqualTo(rawR1);
        assertThat(replacementCookie.isHttpOnly()).isTrue();
        assertThat(replacementCookie.getPath()).isEqualTo("/");
    }

    @Test
    @DisplayName("7. Old refresh token cannot be reused after rotation (triggers reuse detection)")
    void oldRefreshTokenCannotBeReused() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        // 1st Refresh: R1 -> R2
        MvcResult firstRefresh = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookieR2 = firstRefresh.getResponse().getCookie("kk_refresh");
        assertThat(cookieR2).isNotNull();
        String rawR2 = cookieR2.getValue();

        // Attempt reuse of consumed R1 -> rejected 401 Unauthorized
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());

        // Entire family was revoked by reuse detection -> R2 now also fails
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR2), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("8. Concurrent refresh requests preserve strict rotation semantics")
    void concurrentRefreshStrictRotation() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Callable<Integer> task = () -> {
            startLatch.await();
            try {
                MvcResult res = mockMvc.perform(post("/api/v1/auth/refresh")
                                .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                                .header("X-XSRF-TOKEN", CSRF_TOKEN)
                                .header("Origin", VALID_ORIGIN))
                        .andReturn();
                return res.getResponse().getStatus();
            } catch (Exception e) {
                return 500;
            }
        };

        Future<Integer> f1 = executor.submit(task);
        Future<Integer> f2 = executor.submit(task);

        startLatch.countDown();

        int s1 = f1.get(5, TimeUnit.SECONDS);
        int s2 = f2.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one request succeeds (200), and the other fails (401)
        assertThat((s1 == 200 && s2 == 401) || (s1 == 401 && s2 == 200)).isTrue();
    }

    @Test
    @DisplayName("9. Absolute 7-day expiry is preserved across rotations; no sliding expiration")
    void absoluteExpirationPreserved() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();
        String r1Hash = RefreshTokenService.hashToken(rawR1);
        RefreshToken tokenR1 = refreshTokenRepository.findByTokenHash(r1Hash).orElseThrow();
        Instant originalAbsoluteExpiry = tokenR1.getSessionAbsoluteExpiresAt();

        // Perform rotation
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk())
                .andReturn();

        String rawR2 = refreshResult.getResponse().getCookie("kk_refresh").getValue();
        String r2Hash = RefreshTokenService.hashToken(rawR2);
        RefreshToken tokenR2 = refreshTokenRepository.findByTokenHash(r2Hash).orElseThrow();

        assertThat(tokenR2.getSessionAbsoluteExpiresAt().truncatedTo(ChronoUnit.SECONDS))
                .isEqualTo(originalAbsoluteExpiry.truncatedTo(ChronoUnit.SECONDS));
        assertThat(tokenR2.getFamilyId()).isEqualTo(tokenR1.getFamilyId());
    }

    // ==========================================
    // B. REFRESH SECURITY TESTS
    // ==========================================

    @Test
    @DisplayName("10-12. Missing, invalid, or expired refresh cookie rejected with 401")
    void invalidRefreshCookieRejected() throws Exception {
        // Missing cookie
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());

        // Invalid opaque token cookie
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie("completely-bogus-token"), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());

        // Expired token
        RefreshTokenService.CreatedSession session = refreshTokenService.createSession(testUser, "127.0.0.1", "Agent");
        RefreshToken token = refreshTokenRepository.findByTokenHash(RefreshTokenService.hashToken(session.rawRefreshToken())).orElseThrow();
        token.setExpiresAt(Instant.now().minusSeconds(3600));
        refreshTokenRepository.save(token);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(session.rawRefreshToken()), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("13-14. Suspended or deleted account cannot refresh")
    void suspendedOrDeletedAccountCannotRefresh() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        // 1. Suspend account
        testUser.setStatus(UserStatus.SUSPENDED);
        userRepository.save(testUser);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());

        // 2. Unsuspend, then mark deleted
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setDeletedAt(Instant.now());
        userRepository.save(testUser);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("15-16. sessionsInvalidatedAt and passwordChangedAt block refresh")
    void invalidationTimestampsBlockRefresh() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        // Invalidate via password change
        testUser.setPasswordChangedAt(Instant.now().plusSeconds(1));
        userRepository.save(testUser);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());

        // Invalidate via sessionsInvalidatedAt (logout-all)
        String rawR2 = doLoginAndExtractRefreshCookie();
        testUser.setSessionsInvalidatedAt(Instant.now().plusSeconds(1));
        userRepository.save(testUser);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR2), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // C. CSRF & ORIGIN TESTS
    // ==========================================

    @Test
    @DisplayName("19-21. Refresh without X-XSRF-TOKEN or with incorrect token fails 403; valid token succeeds 200")
    void csrfValidationOnRefresh() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        // 1. Missing header -> 403 Forbidden
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isForbidden());

        // 2. Mismatched token header -> 403 Forbidden
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", "wrong-csrf-token")
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isForbidden());

        // 3. Matching CSRF header and cookie -> 200 OK
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("22-23. Refresh from untrusted origin is rejected 403; trusted origin succeeds 200")
    void originValidationOnRefresh() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();

        // Untrusted attacker origin -> 403 Forbidden
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", "https://malicious-site.com"))
                .andExpect(status().isForbidden());

        // Trusted origin -> 200 OK
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk());
    }

    // ==========================================
    // D. LOGOUT TESTS
    // ==========================================

    @Test
    @DisplayName("24-26. Logout with valid cookie invalidates session, clears cookie (Max-Age=0), and omits refresh token from JSON")
    void logoutWithValidCookie() throws Exception {
        String rawR1 = doLoginAndExtractRefreshCookie();
        String r1Hash = RefreshTokenService.hashToken(rawR1);
        RefreshToken tokenR1 = refreshTokenRepository.findByTokenHash(r1Hash).orElseThrow();

        MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(createRefreshCookie(rawR1), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();

        // Verify session was revoked in database
        RefreshToken tokenAfter = refreshTokenRepository.findByTokenHash(r1Hash).orElseThrow();
        assertThat(tokenAfter.isRevoked()).isTrue();

        // Verify Set-Cookie clears the refresh cookie (Max-Age=0)
        Cookie clearedCookie = logoutResult.getResponse().getCookie("kk_refresh");
        assertThat(clearedCookie).isNotNull();
        assertThat(clearedCookie.getMaxAge()).isEqualTo(0);
        assertThat(clearedCookie.isHttpOnly()).isTrue();
    }

    @Test
    @DisplayName("27-29. Logout without cookie or with already-invalid session behaves safely (200, clears cookie)")
    void logoutWithoutCookieBehavesSafely() throws Exception {
        // Missing cookie logout
        MvcResult res1 = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andReturn();

        Cookie clearCookie1 = res1.getResponse().getCookie("kk_refresh");
        assertThat(clearCookie1).isNotNull();
        assertThat(clearCookie1.getMaxAge()).isEqualTo(0);

        // Bogus token logout
        MvcResult res2 = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(createRefreshCookie("already-invalid-or-fake-token"), createCsrfCookie())
                        .header("X-XSRF-TOKEN", CSRF_TOKEN)
                        .header("Origin", VALID_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andReturn();

        Cookie clearCookie2 = res2.getResponse().getCookie("kk_refresh");
        assertThat(clearCookie2).isNotNull();
        assertThat(clearCookie2.getMaxAge()).isEqualTo(0);
    }
}
