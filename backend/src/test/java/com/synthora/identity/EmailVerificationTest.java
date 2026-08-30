package com.synthora.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.SynthoraApplication;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.ResendVerificationRequest;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.identity.dto.VerifyEmailRequest;
import com.synthora.identity.service.EmailVerificationService;
import com.synthora.notification.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SynthoraApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EmailVerificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private com.synthora.product.SupplierRepository supplierRepository;

    @Autowired
    private com.synthora.seller.SellerProfileRepository sellerProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        sellerProfileRepository.deleteAll();
        supplierRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Buyer registration generates verification token, sends email, and prevents login until verified")
    void testBuyerRegistration_requiresEmailVerificationBeforeLogin() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "Unverified Buyer",
                "unverified.buyer@synthora.com",
                "+1234567890",
                "Password123!",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("unverified.buyer@synthora.com"));

        // Verify email was dispatched
        verify(emailService, times(1)).sendHtmlEmail(
                eq("unverified.buyer@synthora.com"),
                eq("[KemKendra] Verify Your Email Address"),
                anyString()
        );

        // Verify token saved in database
        User user = userRepository.findByEmail("unverified.buyer@synthora.com").orElseThrow();
        assertThat(user.getEmailVerifiedAt()).isNull();

        List<EmailVerificationToken> tokens = tokenRepository.findByUserAndUsedAtIsNull(user);
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getTokenHash()).isNotBlank();
        assertThat(tokens.get(0).getExpiresAt()).isAfter(Instant.now());

        // Attempt login before verification -> Must fail
        LoginRequest loginReq = new LoginRequest("unverified.buyer@synthora.com", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please verify your email address before logging in. Check your inbox for the verification link."));
    }

    @Test
    @DisplayName("2. Supplier registration generates verification token, sends email, and does not issue JWT")
    void testSupplierRegistration_requiresEmailVerification() throws Exception {
        SupplierRegisterRequest supplierReq = new SupplierRegisterRequest(
                "Pharma Bio Ltd",
                "supplier.unverified@pharma.com",
                "Password123!",
                "Pharma Bio Ltd",
                "India",
                "IN",
                "+919876543210",
                "Mumbai",
                "https://pharmabio.com",
                "Leading API manufacturer",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supplierReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("supplier.unverified@pharma.com"))
                .andExpect(jsonPath("$.token").doesNotExist()); // No JWT token returned!

        verify(emailService, times(1)).sendHtmlEmail(
                eq("supplier.unverified@pharma.com"),
                eq("[KemKendra] Verify Your Email Address"),
                anyString()
        );

        User supplierUser = userRepository.findByEmail("supplier.unverified@pharma.com").orElseThrow();
        assertThat(supplierUser.getEmailVerifiedAt()).isNull();
    }

    @Test
    @DisplayName("3. Valid token verifies email and enables login")
    void testVerifyEmail_successAllowsLogin() throws Exception {
        // Register user
        User user = new User();
        user.setName("Verification Candidate");
        user.setEmail("candidate@synthora.com");
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        String rawToken = "test-raw-verification-token-123456789";
        String tokenHash = EmailVerificationService.hashToken(rawToken);
        EmailVerificationToken token = new EmailVerificationToken(
                null,
                user,
                tokenHash,
                Instant.now().plus(24, ChronoUnit.HOURS)
        );
        tokenRepository.save(token);

        // Perform verification
        VerifyEmailRequest verifyReq = new VerifyEmailRequest(rawToken);
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully. You can now log in."));

        // Check user is marked as verified
        User verifiedUser = userRepository.findByEmail("candidate@synthora.com").orElseThrow();
        assertThat(verifiedUser.getEmailVerifiedAt()).isNotNull();

        // Check token is marked as used
        EmailVerificationToken usedToken = tokenRepository.findByTokenHash(tokenHash).orElseThrow();
        assertThat(usedToken.getUsedAt()).isNotNull();

        // Login should now succeed
        LoginRequest loginReq = new LoginRequest("candidate@synthora.com", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    @DisplayName("4. Expired verification token is rejected")
    void testVerifyEmail_expiredToken() throws Exception {
        User user = new User();
        user.setName("Expired Candidate");
        user.setEmail("expired@synthora.com");
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        String rawToken = "expired-token-raw-value";
        String tokenHash = EmailVerificationService.hashToken(rawToken);
        EmailVerificationToken token = new EmailVerificationToken(
                null,
                user,
                tokenHash,
                Instant.now().minus(1, ChronoUnit.HOURS) // Expired 1 hour ago
        );
        tokenRepository.save(token);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest(rawToken);
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This verification link has expired. Please request a new verification email."));

        User unverifiedUser = userRepository.findByEmail("expired@synthora.com").orElseThrow();
        assertThat(unverifiedUser.getEmailVerifiedAt()).isNull();
    }

    @Test
    @DisplayName("5. Already-used verification token is rejected")
    void testVerifyEmail_usedToken() throws Exception {
        User user = new User();
        user.setName("Reused Token User");
        user.setEmail("reused@synthora.com");
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        String rawToken = "already-used-token";
        String tokenHash = EmailVerificationService.hashToken(rawToken);
        EmailVerificationToken token = new EmailVerificationToken(
                null,
                user,
                tokenHash,
                Instant.now().plus(24, ChronoUnit.HOURS)
        );
        token.setUsedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        tokenRepository.save(token);

        VerifyEmailRequest verifyReq = new VerifyEmailRequest(rawToken);
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This verification link has already been used. Please sign in or request a new one."));
    }

    @Test
    @DisplayName("6. Resend verification creates new token and dispatches email")
    void testResendVerification_success() throws Exception {
        User user = new User();
        user.setName("Resend Candidate");
        user.setEmail("resend@synthora.com");
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        // Token created 2 minutes ago (beyond 60s cooldown)
        EmailVerificationToken oldToken = new EmailVerificationToken(
                null,
                user,
                "old-token-hash",
                Instant.now().plus(24, ChronoUnit.HOURS)
        );
        oldToken.setCreatedAt(Instant.now().minus(2, ChronoUnit.MINUTES));
        tokenRepository.save(oldToken);

        ResendVerificationRequest resendReq = new ResendVerificationRequest("resend@synthora.com");
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an unverified account exists for this email, a verification link has been sent."));

        verify(emailService, times(1)).sendHtmlEmail(
                eq("resend@synthora.com"),
                eq("[KemKendra] Verify Your Email Address"),
                anyString()
        );

        // Old token invalidated, new token exists
        List<EmailVerificationToken> activeTokens = tokenRepository.findByUserAndUsedAtIsNull(user);
        assertThat(activeTokens).hasSize(1);
        assertThat(activeTokens.get(0).getTokenHash()).isNotEqualTo("old-token-hash");
    }

    @Test
    @DisplayName("7. Resend verification throttles if within 60-second cooldown")
    void testResendVerification_throttledWithin60Seconds() throws Exception {
        User user = new User();
        user.setName("Throttled User");
        user.setEmail("throttled@synthora.com");
        user.setPasswordHash(passwordEncoder.encode("Password123!"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);

        // Token created 10 seconds ago (inside 60s cooldown)
        EmailVerificationToken recentToken = new EmailVerificationToken(
                null,
                user,
                "recent-token-hash",
                Instant.now().plus(24, ChronoUnit.HOURS)
        );
        recentToken.setCreatedAt(Instant.now().minus(10, ChronoUnit.SECONDS));
        tokenRepository.save(recentToken);

        ResendVerificationRequest resendReq = new ResendVerificationRequest("throttled@synthora.com");
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an unverified account exists for this email, a verification link has been sent."));

        // No new email dispatched due to cooldown
        verify(emailService, never()).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("8. Legacy verified user and Admin can login without verification error")
    void testLegacyAndAdminLogin_succeeds() throws Exception {
        // Legacy user with email_verified_at set (as by V40 migration)
        User legacyUser = new User();
        legacyUser.setName("Legacy User");
        legacyUser.setEmail("legacy@synthora.com");
        legacyUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        legacyUser.setRole(UserRole.USER);
        legacyUser.setStatus(UserStatus.ACTIVE);
        legacyUser.setEmailVerifiedAt(Instant.now().minus(30, ChronoUnit.DAYS));
        userRepository.save(legacyUser);

        LoginRequest legacyLogin = new LoginRequest("legacy@synthora.com", "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(legacyLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        // Admin user can log in even if emailVerifiedAt is null
        User adminUser = new User();
        adminUser.setName("Admin User");
        adminUser.setEmail("admin@synthora.com");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(adminUser);

        LoginRequest adminLogin = new LoginRequest("admin@synthora.com", "AdminPass123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
    }
}
