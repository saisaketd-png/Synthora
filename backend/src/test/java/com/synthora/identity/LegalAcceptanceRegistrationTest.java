package com.synthora.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.SynthoraApplication;
import com.synthora.common.LegalConstants;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.SupplierRegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SynthoraApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LegalAcceptanceRegistrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.synthora.product.SupplierRepository supplierRepository;

    @Autowired
    private com.synthora.seller.SellerProfileRepository sellerProfileRepository;

    @Autowired
    private com.synthora.identity.EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        emailVerificationTokenRepository.deleteAll();
        sellerProfileRepository.deleteAll();
        supplierRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Buyer registration with termsAccepted=true and privacyAccepted=true succeeds and stores audit metadata")
    void testBuyerRegistration_successWithLegalAcceptance() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Legal Buyer",
                "buyer.legal@synthora-test.com",
                "+1234567890",
                "Password123!",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("buyer.legal@synthora-test.com"));

        User saved = userRepository.findByEmail("buyer.legal@synthora-test.com").orElseThrow();
        assertThat(saved.getTermsAcceptedAt()).isNotNull();
        assertThat(saved.getTermsVersion()).isEqualTo(LegalConstants.CURRENT_TERMS_VERSION);
        assertThat(saved.getPrivacyAcceptedAt()).isNotNull();
        assertThat(saved.getPrivacyVersion()).isEqualTo(LegalConstants.CURRENT_PRIVACY_VERSION);
    }

    @Test
    @DisplayName("Buyer registration without Terms acceptance fails (400)")
    void testBuyerRegistration_missingTermsFails() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "No Terms Buyer",
                "noterms@synthora-test.com",
                "+1234567891",
                "Password123!",
                false,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(userRepository.findByEmail("noterms@synthora-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Buyer registration without Privacy acceptance fails (400)")
    void testBuyerRegistration_missingPrivacyFails() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "No Privacy Buyer",
                "noprivacy@synthora-test.com",
                "+1234567892",
                "Password123!",
                true,
                false
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(userRepository.findByEmail("noprivacy@synthora-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Buyer registration with missing/null acceptance fields fails (400)")
    void testBuyerRegistration_nullAcceptanceFieldsFails() throws Exception {
        String jsonWithoutLegal = """
                {
                    "name": "Null Legal Buyer",
                    "email": "nulllegal@synthora-test.com",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonWithoutLegal))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(userRepository.findByEmail("nulllegal@synthora-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Supplier registration with termsAccepted=true and privacyAccepted=true succeeds and stores audit metadata")
    void testSupplierRegistration_successWithLegalAcceptance() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "Legal Supplier",
                "supplier.legal@synthora-test.com",
                "SupplierPassword123!",
                "Legal Chemical Corp",
                "Germany",
                "DE",
                "+49123456789",
                "Frankfurt",
                "https://legal-chem.com",
                "Specialty chemical distributor",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Supplier registered successfully. Please verify your email before logging in."))
                .andExpect(jsonPath("$.token").doesNotExist());

        User saved = userRepository.findByEmail("supplier.legal@synthora-test.com").orElseThrow();
        assertThat(saved.getTermsAcceptedAt()).isNotNull();
        assertThat(saved.getTermsVersion()).isEqualTo(LegalConstants.CURRENT_TERMS_VERSION);
        assertThat(saved.getPrivacyAcceptedAt()).isNotNull();
        assertThat(saved.getPrivacyVersion()).isEqualTo(LegalConstants.CURRENT_PRIVACY_VERSION);
    }

    @Test
    @DisplayName("Supplier registration without Terms acceptance fails (400)")
    void testSupplierRegistration_missingTermsFails() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "No Terms Supplier",
                "supplier.noterms@synthora-test.com",
                "SupplierPassword123!",
                "No Terms Corp",
                "India",
                "IN",
                null,
                null,
                null,
                null,
                false,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(userRepository.findByEmail("supplier.noterms@synthora-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Supplier registration without Privacy acceptance fails (400)")
    void testSupplierRegistration_missingPrivacyFails() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "No Privacy Supplier",
                "supplier.noprivacy@synthora-test.com",
                "SupplierPassword123!",
                "No Privacy Corp",
                "India",
                "IN",
                null,
                null,
                null,
                null,
                true,
                false
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(userRepository.findByEmail("supplier.noprivacy@synthora-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Legacy users without terms/privacy records can still log in and authenticate cleanly")
    void testLegacyUserWithoutLegalFields_authenticatesSuccessfully() throws Exception {
        User legacyUser = new User();
        legacyUser.setName("Legacy User");
        legacyUser.setEmail("legacy@synthora-test.com");
        legacyUser.setPasswordHash(passwordEncoder.encode("LegacyPassword123!"));
        legacyUser.setRole(UserRole.USER);
        legacyUser.setStatus(UserStatus.ACTIVE);
        legacyUser.setTermsAcceptedAt(null);
        legacyUser.setTermsVersion(null);
        legacyUser.setPrivacyAcceptedAt(null);
        legacyUser.setPrivacyVersion(null);
        legacyUser.setEmailVerifiedAt(Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS));
        userRepository.save(legacyUser);

        LoginRequest loginRequest = new LoginRequest("legacy@synthora-test.com", "LegacyPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
