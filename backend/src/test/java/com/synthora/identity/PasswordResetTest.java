package com.synthora.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.SynthoraApplication;
import com.synthora.identity.dto.ForgotPasswordRequest;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.ResetPasswordRequest;
import com.synthora.identity.service.PasswordResetService;
import com.synthora.notification.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
import java.util.Optional;
import java.util.UUID;

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
public class PasswordResetTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmailService emailService;

    private User testUser;
    private final String originalPassword = "InitialSecurePassword123!";

    @BeforeEach
    void setUp() {
        emailVerificationTokenRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setName("Test Procurement User");
        testUser.setEmail("buyer@synthora-test.com");
        testUser.setPasswordHash(passwordEncoder.encode(originalPassword));
        testUser.setRole(UserRole.USER);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setEmailVerifiedAt(Instant.now());
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("Forgot password with existing email creates token, sends email, and returns generic success")
    void testForgotPassword_existingEmail() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest(testUser.getEmail());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists for this email, a password reset link has been sent."));

        // Verify token in database
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByUserAndUsedAtIsNull(testUser);
        assertThat(tokens).hasSize(1);
        PasswordResetToken token = tokens.get(0);
        assertThat(token.getTokenHash()).isNotBlank();
        assertThat(token.getExpiresAt()).isAfter(Instant.now());
        assertThat(token.getUsedAt()).isNull();

        // Verify email was dispatched
        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendHtmlEmail(emailCaptor.capture(), subjectCaptor.capture(), bodyCaptor.capture());

        assertThat(emailCaptor.getValue()).isEqualTo(testUser.getEmail());
        assertThat(subjectCaptor.getValue()).contains("Reset Your Password");
        assertThat(bodyCaptor.getValue()).contains("reset-password?token=");
    }

    @Test
    @DisplayName("Forgot password with non-existent email returns identical generic success without dispatching email (anti-enumeration)")
    void testForgotPassword_nonExistentEmail() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent@domain.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists for this email, a password reset link has been sent."));

        // Verify no email was dispatched
        verify(emailService, never()).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Repeated forgot password requests invalidate prior active tokens")
    void testForgotPassword_invalidatesPriorActiveTokens() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest(testUser.getEmail());

        // First request
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        List<PasswordResetToken> initialTokens = passwordResetTokenRepository.findAll();
        assertThat(initialTokens).hasSize(1);
        PasswordResetToken firstToken = initialTokens.get(0);
        assertThat(firstToken.getUsedAt()).isNull();

        // Second request
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        List<PasswordResetToken> allTokens = passwordResetTokenRepository.findAll();
        assertThat(allTokens).hasSize(2);

        PasswordResetToken reloadedFirst = passwordResetTokenRepository.findById(firstToken.getId()).orElseThrow();
        assertThat(reloadedFirst.getUsedAt()).isNotNull(); // First token was invalidated

        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findByUserAndUsedAtIsNull(testUser);
        assertThat(activeTokens).hasSize(1);
        assertThat(activeTokens.get(0).getId()).isNotEqualTo(firstToken.getId());
    }

    @Test
    @DisplayName("Reset password with valid token updates password, marks token used, and invalidates other tokens")
    void testResetPassword_validToken() throws Exception {
        String rawToken = "sample-secure-raw-token-1234567890abcdef";
        String tokenHash = PasswordResetService.hashToken(rawToken);

        PasswordResetToken token = new PasswordResetToken(null, testUser, tokenHash, Instant.now().plus(15, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(token);

        String newPassword = "BrandNewSecurePassword999!";
        ResetPasswordRequest request = new ResetPasswordRequest(rawToken, newPassword);

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password has been successfully reset. You can now log in with your new password."));

        // Verify token is now marked as used
        PasswordResetToken reloadedToken = passwordResetTokenRepository.findByTokenHash(tokenHash).orElseThrow();
        assertThat(reloadedToken.getUsedAt()).isNotNull();

        // Verify user password in database changed
        User reloadedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(newPassword, reloadedUser.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches(originalPassword, reloadedUser.getPasswordHash())).isFalse();

        // Verify old password fails login
        LoginRequest oldLogin = new LoginRequest(testUser.getEmail(), originalPassword);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        // Verify new password succeeds login
        LoginRequest newLogin = new LoginRequest(testUser.getEmail(), newPassword);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Reset password fails when token has expired")
    void testResetPassword_expiredToken() throws Exception {
        String rawToken = "expired-token-12345";
        String tokenHash = PasswordResetService.hashToken(rawToken);

        // Expired 5 minutes ago
        PasswordResetToken token = new PasswordResetToken(null, testUser, tokenHash, Instant.now().minus(5, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest(rawToken, "NewPassword123!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This password reset link has expired. Please request a new one."));
    }

    @Test
    @DisplayName("Reset password fails when token has already been used (prevents replay attacks)")
    void testResetPassword_alreadyUsedToken() throws Exception {
        String rawToken = "used-token-12345";
        String tokenHash = PasswordResetService.hashToken(rawToken);

        PasswordResetToken token = new PasswordResetToken(null, testUser, tokenHash, Instant.now().plus(15, ChronoUnit.MINUTES));
        token.setUsedAt(Instant.now().minus(1, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest(rawToken, "NewPassword123!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This password reset link has already been used. Please request a new one."));
    }

    @Test
    @DisplayName("Reset password fails with completely invalid token")
    void testResetPassword_invalidToken() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("completely-random-non-existent-token", "NewPassword123!");

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired password reset link."));
    }

    @Test
    @DisplayName("Security check: Raw token is never stored in the database")
    void testSecurity_rawTokenNeverStoredInDatabase() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest(testUser.getEmail());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendHtmlEmail(anyString(), anyString(), bodyCaptor.capture());

        String emailBody = bodyCaptor.getValue();
        int tokenIndex = emailBody.indexOf("token=");
        assertThat(tokenIndex).isGreaterThan(0);
        String rawToken = emailBody.substring(tokenIndex + 6, emailBody.indexOf("\"", tokenIndex));

        // Ensure raw token is NOT in database
        Optional<PasswordResetToken> rawMatch = passwordResetTokenRepository.findByTokenHash(rawToken);
        assertThat(rawMatch).isEmpty();

        // Ensure SHA-256 hash IS in database
        String expectedHash = PasswordResetService.hashToken(rawToken);
        Optional<PasswordResetToken> hashMatch = passwordResetTokenRepository.findByTokenHash(expectedHash);
        assertThat(hashMatch).isPresent();
    }
}
