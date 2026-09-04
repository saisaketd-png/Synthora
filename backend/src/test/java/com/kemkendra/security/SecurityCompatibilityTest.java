package com.kemkendra.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.security.cookie.AuthCookieService;
import com.kemkendra.security.csrf.CsrfCookieProperties;
import jakarta.servlet.http.Cookie;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityCompatibilityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuthCookieService authCookieService;

    @Autowired
    private CsrfCookieProperties csrfCookieProperties;

    private static final String TEST_PASSWORD = "StrongPassword123!";
    private User testUser;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        testUser = new User();
        testUser.setEmail("compat_user@kemkendra.com");
        testUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        testUser.setName("Compatibility Test User");
        testUser.setRole(UserRole.USER);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setEmailVerifiedAt(java.time.Instant.now());
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("1. Successful login issues access JWT in JSON and refreshToken ONLY via HttpOnly cookie")
    void existingLoginWorks() throws Exception {
        Map<String, String> loginReq = Map.of(
                "email", testUser.getEmail(),
                "password", TEST_PASSWORD
        );

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(response.has("token")).isTrue();
        assertThat(response.has("refreshToken")).isFalse();
        Cookie refreshCookie = result.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
    }

    @Test
    @DisplayName("2. Refresh works via HttpOnly cookie with CSRF and Origin, returning new JWT without refreshToken in JSON")
    void existingRefreshWorks() throws Exception {
        // First login
        Map<String, String> loginReq = Map.of(
                "email", testUser.getEmail(),
                "password", TEST_PASSWORD
        );
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNotNull();

        // Refresh using cookie
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie, new Cookie("XSRF-TOKEN", "csrf-token-val"))
                        .header("X-XSRF-TOKEN", "csrf-token-val")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode refreshResp = objectMapper.readTree(refreshResult.getResponse().getContentAsString());
        assertThat(refreshResp.has("token")).isTrue();
        assertThat(refreshResp.has("refreshToken")).isFalse();
    }

    @Test
    @DisplayName("3. Refresh rotation and reuse detection work via cookies")
    void refreshRotationAndReuseDetectionWork() throws Exception {
        // Login to get token R1 in cookie
        Map<String, String> loginReq = Map.of(
                "email", testUser.getEmail(),
                "password", TEST_PASSWORD
        );
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookieR1 = loginResult.getResponse().getCookie("kk_refresh");
        assertThat(cookieR1).isNotNull();

        // Rotate R1 -> R2
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(cookieR1, new Cookie("XSRF-TOKEN", "csrf-token-val"))
                        .header("X-XSRF-TOKEN", "csrf-token-val")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookieR2 = refreshResult.getResponse().getCookie("kk_refresh");
        assertThat(cookieR2).isNotNull();
        assertThat(cookieR2.getValue()).isNotEqualTo(cookieR1.getValue());

        // Attempt reuse of R1 -> triggers reuse detection and invalidation
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(cookieR1, new Cookie("XSRF-TOKEN", "csrf-token-val"))
                        .header("X-XSRF-TOKEN", "csrf-token-val")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());

        // Now R2 must also be invalidated because family was revoked
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(cookieR2, new Cookie("XSRF-TOKEN", "csrf-token-val"))
                        .header("X-XSRF-TOKEN", "csrf-token-val")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("4. Logout via cookie and logout-all via Bearer still work")
    void existingLogoutAndLogoutAllWork() throws Exception {
        Map<String, String> loginReq = Map.of(
                "email", testUser.getEmail(),
                "password", TEST_PASSWORD
        );
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("kk_refresh");
        assertThat(refreshCookie).isNotNull();

        // Logout specific session via cookie
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(refreshCookie, new Cookie("XSRF-TOKEN", "csrf-token-val"))
                        .header("X-XSRF-TOKEN", "csrf-token-val")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk());

        // Refresh token should now be invalidated
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie, new Cookie("XSRF-TOKEN", "csrf-token-val"))
                        .header("X-XSRF-TOKEN", "csrf-token-val")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized());

        // Login again to test logout-all
        MvcResult loginResult2 = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String accessToken2 = objectMapper.readTree(loginResult2.getResponse().getContentAsString()).get("token").asText();

        // Logout all remains Bearer-authenticated
        mockMvc.perform(post("/api/v1/auth/logout-all")
                        .header("Authorization", "Bearer " + accessToken2))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("5. Bearer-authenticated endpoints work without CSRF header")
    void bearerAuthenticatedEndpointsWorkWithoutCsrfHeader() throws Exception {
        Map<String, String> loginReq = Map.of(
                "email", testUser.getEmail(),
                "password", TEST_PASSWORD
        );
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String accessToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // GET /api/v1/users/me with Bearer token
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("6. XSRF-TOKEN cookie is materialized on public or authenticated requests")
    void xsrfTokenCookieMaterializedOnRequests() throws Exception {
        MvcResult result = mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie xsrfCookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(xsrfCookie).isNotNull();
        assertThat(xsrfCookie.isHttpOnly()).isFalse();
        assertThat(xsrfCookie.getPath()).isEqualTo("/");
        assertThat(xsrfCookie.getValue()).isNotEmpty();
    }
}
