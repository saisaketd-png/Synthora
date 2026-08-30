package com.kemkendra.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.KemKendraApplication;
import com.kemkendra.identity.dto.ChangePasswordRequest;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.UpdateProfileRequest;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = KemKendraApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProfileAndChangePasswordTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    private User buyerUser;
    private String buyerToken;

    private User supplierUser;
    private String supplierToken;

    private User adminUser;
    private String adminToken;

    private final String initialPassword = "InitialPassword123!";

    @BeforeEach
    void setUp() {
        emailVerificationTokenRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        // Create Buyer
        buyerUser = new User();
        buyerUser.setName("Buyer John");
        buyerUser.setEmail("buyer@kemkendra-test.com");
        buyerUser.setPhone("+1234567890");
        buyerUser.setPasswordHash(passwordEncoder.encode(initialPassword));
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser.setEmailVerifiedAt(Instant.now());
        buyerUser = userRepository.save(buyerUser);
        buyerToken = jwtService.generateToken(buyerUser);

        // Create Supplier
        supplierUser = new User();
        supplierUser.setName("Supplier Alice");
        supplierUser.setEmail("supplier@kemkendra-test.com");
        supplierUser.setPhone("+1987654321");
        supplierUser.setPasswordHash(passwordEncoder.encode(initialPassword));
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setEmailVerifiedAt(Instant.now());
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        // Create Admin
        adminUser = new User();
        adminUser.setName("Admin Chief");
        adminUser.setEmail("admin@kemkendra-test.com");
        adminUser.setPasswordHash(passwordEncoder.encode(initialPassword));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);
    }

    @Test
    @DisplayName("GET /api/v1/users/me returns authenticated user's profile for Buyer, Supplier, and Admin")
    void testGetProfile_allRoles() throws Exception {
        // Buyer
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(buyerUser.getId().toString()))
                .andExpect(jsonPath("$.name").value("Buyer John"))
                .andExpect(jsonPath("$.email").value("buyer@kemkendra-test.com"))
                .andExpect(jsonPath("$.phone").value("+1234567890"))
                .andExpect(jsonPath("$.role").value("USER"));

        // Supplier
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(supplierUser.getId().toString()))
                .andExpect(jsonPath("$.name").value("Supplier Alice"))
                .andExpect(jsonPath("$.role").value("SUPPLIER"));

        // Admin
        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(adminUser.getId().toString()))
                .andExpect(jsonPath("$.name").value("Admin Chief"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me updates name and phone successfully")
    void testUpdateProfile_success() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Johnathan Doe", "+15554443333");

        mockMvc.perform(put("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Johnathan Doe"))
                .andExpect(jsonPath("$.phone").value("+15554443333"))
                .andExpect(jsonPath("$.email").value("buyer@kemkendra-test.com")); // email is unmodifiable

        User reloaded = userRepository.findById(buyerUser.getId()).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Johnathan Doe");
        assertThat(reloaded.getPhone()).isEqualTo("+15554443333");
        assertThat(reloaded.getEmail()).isEqualTo("buyer@kemkendra-test.com");
    }

    @Test
    @DisplayName("PUT /api/v1/users/me safely clears phone when blank or null without violating uniqueness constraint")
    void testUpdateProfile_clearPhone() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest("Buyer John", "   ");

        mockMvc.perform(put("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").isEmpty());

        User reloaded = userRepository.findById(buyerUser.getId()).orElseThrow();
        assertThat(reloaded.getPhone()).isNull();
    }

    @Test
    @DisplayName("PUT /api/v1/users/me rejects duplicate phone number registered by another user")
    void testUpdateProfile_duplicatePhoneRejected() throws Exception {
        // Attempt to set buyer's phone to supplier's existing phone (+1987654321)
        UpdateProfileRequest request = new UpdateProfileRequest("Buyer John", "+1987654321");

        mockMvc.perform(put("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Phone number is already registered by another account."));
    }

    @Test
    @DisplayName("POST /api/v1/users/me/change-password updates password and invalidates active reset tokens")
    void testChangePassword_success() throws Exception {
        // Setup an outstanding reset token for the buyer
        PasswordResetToken token = new PasswordResetToken(null, buyerUser, "dummy-hash-123", Instant.now().plus(15, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(token);

        String newPassword = "BrandNewSecretPassword2026!";
        ChangePasswordRequest request = new ChangePasswordRequest(initialPassword, newPassword);

        mockMvc.perform(post("/api/v1/users/me/change-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated successfully."));

        // Verify password in DB changed
        User reloaded = userRepository.findById(buyerUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(newPassword, reloaded.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches(initialPassword, reloaded.getPasswordHash())).isFalse();

        // Verify active reset tokens were invalidated
        List<PasswordResetToken> activeTokens = passwordResetTokenRepository.findByUserAndUsedAtIsNull(buyerUser);
        assertThat(activeTokens).isEmpty();

        // Verify old password fails login
        LoginRequest oldLogin = new LoginRequest(buyerUser.getEmail(), initialPassword);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isBadRequest());

        // Verify new password succeeds login
        LoginRequest newLogin = new LoginRequest(buyerUser.getEmail(), newPassword);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/v1/users/me/change-password rejects incorrect current password")
    void testChangePassword_incorrectCurrentPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPassword999!", "BrandNewSecretPassword2026!");

        mockMvc.perform(post("/api/v1/users/me/change-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect."));

        // Verify password did NOT change
        User reloaded = userRepository.findById(buyerUser.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(initialPassword, reloaded.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("POST /api/v1/users/me/change-password rejects new password identical to current password")
    void testChangePassword_identicalPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(initialPassword, initialPassword);

        mockMvc.perform(post("/api/v1/users/me/change-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("New password cannot be the same as current password."));
    }

    @Test
    @DisplayName("POST /api/v1/users/me/change-password rejects new password shorter than 8 characters")
    void testChangePassword_shortPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest(initialPassword, "short");

        mockMvc.perform(post("/api/v1/users/me/change-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
