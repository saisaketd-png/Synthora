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
import org.springframework.http.ResponseCookie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LoginCookieIntegrationTest {

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
    private AuthCookieService authCookieService;

    private static final String TEST_PASSWORD = "StrongSecurePassword123!";
    private User testUser;
    private User adminUser;
    private User suspendedUser;

    @BeforeEach
    public void setup() {
        rateLimiterService.resetAll();
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        testUser = new User();
        testUser.setEmail("login_cookie_buyer@kemkendra.com");
        testUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        testUser.setName("Login Cookie Buyer");
        testUser.setRole(UserRole.USER);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setEmailVerifiedAt(Instant.now());
        testUser = userRepository.save(testUser);

        adminUser = new User();
        adminUser.setEmail("login_cookie_admin@kemkendra.com");
        adminUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        adminUser.setName("Login Cookie Admin");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);

        suspendedUser = new User();
        suspendedUser.setEmail("login_cookie_suspended@kemkendra.com");
        suspendedUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        suspendedUser.setName("Login Cookie Suspended");
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser.setEmailVerifiedAt(Instant.now());
        suspendedUser = userRepository.save(suspendedUser);
    }

    @Test
    @DisplayName("1-4. Successful login returns 200, access JWT, and NEVER exposes refreshToken in JSON")
    void loginReturnsAccessJwtAndOmitsRefreshTokenFromJson() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testUser.getEmail(), TEST_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.expiresIn").isNumber())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.refreshExpiresIn").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.tokenHash").doesNotExist())
                .andReturn();

        String rawJson = result.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(rawJson);

        assertThat(jsonNode.has("refreshToken")).isFalse();
        assertThat(jsonNode.has("refreshExpiresIn")).isFalse();
        assertThat(rawJson.toLowerCase()).doesNotContain("refresh");
    }

    @Test
    @DisplayName("5, 11-14. In development environment, issues kk_refresh cookie with HttpOnly, Path=/, SameSite=Strict, Domain omitted")
    void loginIssuesDevelopmentRefreshCookie() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testUser.getEmail(), TEST_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.getValue()).isNotBlank();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getPath()).isEqualTo("/");
        assertThat(refreshCookie.getAttribute("SameSite")).isEqualTo("Strict");
        assertThat(refreshCookie.getDomain()).isNull();
        assertThat(refreshCookie.getMaxAge()).isGreaterThan(600000); // ~7 days (604800s)

        Collection<String> setCookieHeaders = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(setCookieHeaders).isNotEmpty();
        String cookieHeader = setCookieHeaders.stream()
                .filter(h -> h.contains("kk_refresh"))
                .findFirst()
                .orElseThrow();
        assertThat(cookieHeader).contains("HttpOnly");
        assertThat(cookieHeader).contains("SameSite=Strict");
        assertThat(cookieHeader).contains("Path=/");
        assertThat(cookieHeader.toLowerCase()).doesNotContain("domain=");
    }

    @Test
    @DisplayName("6-10. In production environment (Secure=true), AuthCookieService enforces __Host- prefix, Path=/, Secure, Domain omitted")
    void productionCookieConfigurationEnforcesHostPrefix() {
        AuthCookieProperties prodProps = new AuthCookieProperties();
        prodProps.setSecure(true);
        prodProps.setPath("/");
        prodProps.setSameSite("Strict");

        AuthCookieService prodCookieService = new AuthCookieService(prodProps);
        ResponseCookie cookie = prodCookieService.createRefreshCookie("sample-opaque-token-12345", Duration.ofDays(7));

        assertThat(cookie.getName()).isEqualTo("__Host-kk_refresh");
        assertThat(cookie.isSecure()).isTrue();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/");
        assertThat(cookie.getSameSite()).isEqualTo("Strict");
        assertThat(cookie.getDomain()).isNull();

        String headerString = cookie.toString();
        assertThat(headerString).contains("__Host-kk_refresh=");
        assertThat(headerString).contains("Secure");
        assertThat(headerString).contains("HttpOnly");
        assertThat(headerString).contains("SameSite=Strict");
        assertThat(headerString).contains("Path=/");
        assertThat(headerString.toLowerCase()).doesNotContain("domain=");
    }

    @Test
    @DisplayName("15. Refresh token database persistence stores only SHA-256 hash; raw value absent from DB")
    void databaseStoresHashedTokenOnly() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testUser.getEmail(), TEST_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNotNull();
        String rawToken = refreshCookie.getValue();

        String expectedHash = RefreshTokenService.hashToken(rawToken);
        Optional<RefreshToken> tokenRow = refreshTokenRepository.findByTokenHash(expectedHash);
        assertThat(tokenRow).isPresent();
        assertThat(tokenRow.get().getUser().getId()).isEqualTo(testUser.getId());
        assertThat(tokenRow.get().isActive()).isTrue();

        // Ensure raw token is NOT stored anywhere in the database table
        Integer rawMatches = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM refresh_tokens WHERE token_hash = ?",
                Integer.class,
                rawToken
        );
        assertThat(rawMatches).isEqualTo(0);
    }

    @Test
    @DisplayName("17-18. Access JWT returned by login authenticates API requests and enforces RBAC")
    void accessJwtAuthenticatesAndEnforcesRbac() throws Exception {
        // 1. Regular buyer login
        MvcResult buyerResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(testUser.getEmail(), TEST_PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();

        String buyerJwt = objectMapper.readTree(buyerResult.getResponse().getContentAsString()).get("token").asText();

        // Regular buyer can access /api/v1/users/me
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + buyerJwt))
                .andExpect(status().isOk());

        // Regular buyer CANNOT access /api/v1/admin/users (RBAC check)
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + buyerJwt))
                .andExpect(status().isForbidden());

        // 2. Admin login
        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(adminUser.getEmail(), TEST_PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();

        String adminJwt = objectMapper.readTree(adminResult.getResponse().getContentAsString()).get("token").asText();

        // Admin can access /api/v1/admin/users
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("19. Suspended user login issues review token but DOES NOT issue refresh cookie")
    void suspendedUserDoesNotReceiveRefreshCookie() throws Exception {
        LoginRequest loginRequest = new LoginRequest(suspendedUser.getEmail(), TEST_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();

        // No refresh cookie must be issued for suspended account
        Cookie refreshCookie = result.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNull();
    }

    @Test
    @DisplayName("20. Deleted user login fails closed with HTTP 400 Bad Request")
    void deletedUserLoginFailsClosed() throws Exception {
        testUser.setDeletedAt(Instant.now());
        userRepository.save(testUser);

        LoginRequest loginRequest = new LoginRequest(testUser.getEmail(), TEST_PASSWORD);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("21. Negative test: response body never contains password, hash, CSRF token, or cookie string")
    void negativeTestNoSecretsInLoginResponseBody() throws Exception {
        LoginRequest loginRequest = new LoginRequest(testUser.getEmail(), TEST_PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain(TEST_PASSWORD);
        assertThat(body).doesNotContain("passwordHash");
        assertThat(body).doesNotContain("Set-Cookie");
        assertThat(body).doesNotContain("XSRF-TOKEN");
        assertThat(body).doesNotContain("kk_refresh");
        assertThat(body).doesNotContain("__Host-kk_refresh");
    }
}
