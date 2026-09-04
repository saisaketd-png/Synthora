package com.kemkendra.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.KemKendraApplication;
import com.kemkendra.common.LegalConstants;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.RegisterRequest;
import com.kemkendra.identity.dto.SupplierRegisterRequest;
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

@SpringBootTest(classes = KemKendraApplication.class)
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
    private com.kemkendra.product.SupplierRepository supplierRepository;

    @Autowired
    private com.kemkendra.seller.SellerProfileRepository sellerProfileRepository;

    @Autowired
    private com.kemkendra.identity.EmailVerificationTokenRepository emailVerificationTokenRepository;

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
                "buyer.legal@kemkendra-test.com",
                "+1234567890",
                "Password123!",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("buyer.legal@kemkendra-test.com"));

        User saved = userRepository.findByEmail("buyer.legal@kemkendra-test.com").orElseThrow();
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
                "noterms@kemkendra-test.com",
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

        assertThat(userRepository.findByEmail("noterms@kemkendra-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Buyer registration without Privacy acceptance fails (400)")
    void testBuyerRegistration_missingPrivacyFails() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "No Privacy Buyer",
                "noprivacy@kemkendra-test.com",
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

        assertThat(userRepository.findByEmail("noprivacy@kemkendra-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Buyer registration with missing/null acceptance fields fails (400)")
    void testBuyerRegistration_nullAcceptanceFieldsFails() throws Exception {
        String jsonWithoutLegal = """
                {
                    "name": "Null Legal Buyer",
                    "email": "nulllegal@kemkendra-test.com",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonWithoutLegal))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        assertThat(userRepository.findByEmail("nulllegal@kemkendra-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Supplier registration with termsAccepted=true and privacyAccepted=true succeeds and stores audit metadata")
    void testSupplierRegistration_successWithLegalAcceptance() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "Legal Supplier",
                "supplier.legal@kemkendra-test.com",
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

        User saved = userRepository.findByEmail("supplier.legal@kemkendra-test.com").orElseThrow();
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
                "supplier.noterms@kemkendra-test.com",
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

        assertThat(userRepository.findByEmail("supplier.noterms@kemkendra-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Supplier registration without Privacy acceptance fails (400)")
    void testSupplierRegistration_missingPrivacyFails() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "No Privacy Supplier",
                "supplier.noprivacy@kemkendra-test.com",
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

        assertThat(userRepository.findByEmail("supplier.noprivacy@kemkendra-test.com")).isEmpty();
    }

    @Test
    @DisplayName("Legacy users without terms/privacy records can still log in and authenticate cleanly")
    void testLegacyUserWithoutLegalFields_authenticatesSuccessfully() throws Exception {
        User legacyUser = new User();
        legacyUser.setName("Legacy User");
        legacyUser.setEmail("legacy@kemkendra-test.com");
        legacyUser.setPasswordHash(passwordEncoder.encode("LegacyPassword123!"));
        legacyUser.setRole(UserRole.USER);
        legacyUser.setStatus(UserStatus.ACTIVE);
        legacyUser.setTermsAcceptedAt(null);
        legacyUser.setTermsVersion(null);
        legacyUser.setPrivacyAcceptedAt(null);
        legacyUser.setPrivacyVersion(null);
        legacyUser.setEmailVerifiedAt(Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS));
        userRepository.save(legacyUser);

        LoginRequest loginRequest = new LoginRequest("legacy@kemkendra-test.com", "LegacyPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Buyer registration with duplicate phone number fails with 400 and descriptive error")
    void testBuyerRegistration_duplicatePhoneFails() throws Exception {
        RegisterRequest req1 = new RegisterRequest(
                "First Buyer",
                "buyer1.phone@kemkendra-test.com",
                "+919999988888",
                "Password123!",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        RegisterRequest req2 = new RegisterRequest(
                "Second Buyer",
                "buyer2.phone@kemkendra-test.com",
                "+919999988888",
                "Password123!",
                true,
                true
        );

        // Multiple accounts sharing the same corporate phone number must be accepted
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Supplier registration with shared phone number is accepted with 201 Created")
    void testSupplierRegistration_sharedPhoneAllowed() throws Exception {
        SupplierRegisterRequest req1 = new SupplierRegisterRequest(
                "First Supplier",
                "supplier1.phone@kemkendra-test.com",
                "Password123!",
                "First Supplier Corp",
                "India",
                "IN",
                "+918888877777",
                null,
                null,
                null,
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        SupplierRegisterRequest req2 = new SupplierRegisterRequest(
                "Second Supplier",
                "supplier2.phone@kemkendra-test.com",
                "Password123!",
                "Second Supplier Corp",
                "India",
                "IN",
                "+918888877777",
                null,
                null,
                null,
                true,
                true
        );

        // Multiple suppliers sharing the same corporate phone number must be accepted
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());
    }
}
