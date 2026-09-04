package com.kemkendra.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.dto.ForgotPasswordRequest;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.RegisterRequest;
import com.kemkendra.security.ratelimit.RateLimitProperties;
import com.kemkendra.security.ratelimit.RateLimiterStorage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RateLimitingSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RateLimitProperties rateLimitProperties;

    @Autowired
    private RateLimiterStorage rateLimiterStorage;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        rateLimitProperties.setEnabled(true);
        rateLimiterStorage.resetAll();

        // Configure tight limits for test predictability
        rateLimitProperties.getLogin().setLimit(3);
        rateLimitProperties.getLogin().setWindowSeconds(60);

        rateLimitProperties.getRegistration().setLimit(2);
        rateLimitProperties.getRegistration().setWindowSeconds(60);

        rateLimitProperties.getPasswordReset().setLimit(2);
        rateLimitProperties.getPasswordReset().setWindowSeconds(60);

        rateLimitProperties.getEmailVerification().setLimit(2);
        rateLimitProperties.getEmailVerification().setWindowSeconds(60);

        rateLimitProperties.getPublicApi().setLimit(5);
        rateLimitProperties.getPublicApi().setWindowSeconds(60);
    }

    @AfterEach
    void tearDown() {
        rateLimitProperties.setEnabled(false);
        rateLimiterStorage.resetAll();
    }

    @Test
    @DisplayName("Requests under limit succeed and emit X-RateLimit-Remaining header")
    void testRequestsUnderLimitSucceed() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                .header("X-Forwarded-For", "198.51.100.1"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-RateLimit-Remaining", "4"));

        mockMvc.perform(get("/api/v1/products")
                .header("X-Forwarded-For", "198.51.100.1"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-RateLimit-Remaining", "3"));
    }

    @Test
    @DisplayName("Public API requests exceeding limit return HTTP 429 and Retry-After header")
    void testPublicApiRateLimitExceeded() throws Exception {
        String testIp = "198.51.100.2";

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/products").header("X-Forwarded-For", testIp))
                    .andExpect(status().isOk());
        }

        // 6th request must be rejected with 429
        mockMvc.perform(get("/api/v1/products").header("X-Forwarded-For", testIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status", is(429)))
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")))
                .andExpect(jsonPath("$.message", containsString("Too many requests")));
    }

    @Test
    @DisplayName("Login endpoint enforces rate limiting per client IP")
    void testLoginEndpointRateLimiting() throws Exception {
        String testIp = "198.51.100.3";
        LoginRequest req = new LoginRequest("user@example.com", "WrongPassword123!");
        String json = objectMapper.writeValueAsString(req);

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
                    .header("X-Forwarded-For", testIp));
        }

        // 4th login attempt must be rejected with 429 by rate limiting filter
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .header("X-Forwarded-For", testIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Registration endpoint enforces rate limiting and blocks automated account creation")
    void testRegistrationRateLimiting() throws Exception {
        String testIp = "198.51.100.4";
        RegisterRequest req = new RegisterRequest(
                "Buyer Name",
                "buyer.bot@example.com",
                "Password123!",
                "+1234567890",
                true,
                true
        );
        String json = objectMapper.writeValueAsString(req);

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
                    .header("X-Forwarded-For", testIp));
        }

        // 3rd attempt must be rate-limited
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .header("X-Forwarded-For", testIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Forgot Password endpoint enforces rate limiting and protects against recovery abuse")
    void testForgotPasswordRateLimiting() throws Exception {
        String testIp = "198.51.100.5";
        ForgotPasswordRequest req = new ForgotPasswordRequest("target@example.com");
        String json = objectMapper.writeValueAsString(req);

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
                    .header("X-Forwarded-For", testIp));
        }

        // 3rd attempt must be rate-limited
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .header("X-Forwarded-For", testIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Different client IPs are isolated and do not block one another")
    void testClientIpIsolation() throws Exception {
        String ipA = "203.0.113.10";
        String ipB = "203.0.113.20";

        // Exhaust limit for IP A
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/products").header("X-Forwarded-For", ipA))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/v1/products").header("X-Forwarded-For", ipA))
                .andExpect(status().isTooManyRequests());

        // IP B should still be allowed
        mockMvc.perform(get("/api/v1/products").header("X-Forwarded-For", ipB))
                .andExpect(status().isOk())
                .andExpect(header().string("X-RateLimit-Remaining", "4"));
    }

    @Test
    @DisplayName("Disabling rate limiting in configuration allows unlimited requests")
    void testDisabledRateLimiting() throws Exception {
        rateLimitProperties.setEnabled(false);
        String testIp = "198.51.100.6";

        for (int i = 0; i < 10; i++) {
            mockMvc.perform(get("/api/v1/products").header("X-Forwarded-For", testIp))
                    .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Concurrent requests are thread-safe and accurately enforced")
    void testConcurrentRateLimiting() throws Exception {
        String testKey = "CONCURRENT:198.51.100.7";
        int totalRequests = 50;
        int maxAllowed = 10;
        long windowSeconds = 60;

        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(totalRequests);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rateLimitedCount = new AtomicInteger(0);

        for (int i = 0; i < totalRequests; i++) {
            executor.submit(() -> {
                try {
                    com.kemkendra.security.ratelimit.RateLimitResult res =
                            rateLimiterStorage.tryConsume(testKey, maxAllowed, windowSeconds);
                    if (res.allowed()) {
                        successCount.incrementAndGet();
                    } else {
                        rateLimitedCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(maxAllowed, successCount.get());
        assertEquals(totalRequests - maxAllowed, rateLimitedCount.get());
    }

    @Test
    @DisplayName("Direct untrusted connection ignores spoofed X-Forwarded-For headers")
    void testDirectUntrustedRequestIgnoresSpoofedXForwardedFor() throws Exception {
        String directUntrustedIp = "203.0.113.88";

        // Perform 5 requests with spoofed X-Forwarded-For
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/products")
                    .with(req -> {
                        req.setRemoteAddr(directUntrustedIp);
                        return req;
                    })
                    .header("X-Forwarded-For", "1.1.1." + i))
                    .andExpect(status().isOk());
        }

        // 6th request with a new spoofed X-Forwarded-For IP must STILL be rate limited because direct remoteAddr is tracked
        mockMvc.perform(get("/api/v1/products")
                .with(req -> {
                    req.setRemoteAddr(directUntrustedIp);
                    return req;
                })
                .header("X-Forwarded-For", "9.9.9.9"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Multi-hop X-Forwarded-For extracts rightmost untrusted client IP, ignoring client-prepended headers")
    void testMultiHopXForwardedForExtractsRightmostUntrustedClient() throws Exception {
        String realClientIp = "203.0.113.99";

        // Attacker sends header with spoofed IP prepended before their real IP
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/products")
                    .header("X-Forwarded-For", "10.0.0.1, 1.2.3." + i + ", " + realClientIp))
                    .andExpect(status().isOk());
        }

        // 6th attempt with a different spoofed prefix must be rejected because realClientIp is exhausted
        mockMvc.perform(get("/api/v1/products")
                .header("X-Forwarded-For", "8.8.8.8, " + realClientIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Direct untrusted connection ignores spoofed CF-Connecting-IP")
    void testDirectUntrustedRequestIgnoresCFConnectingIp() throws Exception {
        String directUntrustedIp = "203.0.113.77";

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/products")
                    .with(req -> {
                        req.setRemoteAddr(directUntrustedIp);
                        return req;
                    })
                    .header("CF-Connecting-IP", "8.8.8." + i))
                    .andExpect(status().isOk());
        }

        // 6th attempt with different CF-Connecting-IP must be rejected
        mockMvc.perform(get("/api/v1/products")
                .with(req -> {
                    req.setRemoteAddr(directUntrustedIp);
                    return req;
                })
                .header("CF-Connecting-IP", "1.2.3.4"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    @DisplayName("Legitimate CF-Connecting-IP is respected when arriving via trusted proxy")
    void testLegitimateCFConnectingIpViaTrustedProxy() throws Exception {
        String clientIp = "198.51.100.22";

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/api/v1/products")
                    .header("CF-Connecting-IP", clientIp))
                    .andExpect(status().isOk());
        }

        // 6th request from same client is rate limited
        mockMvc.perform(get("/api/v1/products")
                .header("CF-Connecting-IP", clientIp))
                .andExpect(status().isTooManyRequests());
    }
}
