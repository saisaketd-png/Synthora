package com.kemkendra.admin.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.admin.config.dto.AdminConfigDtos.UpdateFeatureFlagRequest;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.identity.dto.RegisterRequest;
import com.kemkendra.rfq.dto.CreateRfqRequest;
import com.kemkendra.security.JwtService;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminFeatureControlSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private FeatureToggleService featureToggleService;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    void setUp() {
        featureToggleService.clearCache();
        featureToggleService.initDefaults();

        User admin = createTestUser("admin_fc@kemkendra.com", UserRole.ADMIN, UserStatus.ACTIVE);
        adminToken = "Bearer " + jwtService.generateToken(admin);

        User buyer = createTestUser("buyer_fc@kemkendra.com", UserRole.USER, UserStatus.ACTIVE);
        buyerToken = "Bearer " + jwtService.generateToken(buyer);

        User supplier = createTestUser("supplier_fc@kemkendra.com", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierToken = "Bearer " + jwtService.generateToken(supplier);
    }

    private User createTestUser(String email, UserRole role, UserStatus status) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setName("Test " + email);
            u.setEmail(email);
            u.setPasswordHash(passwordEncoder.encode("Secret123!"));
            u.setRole(role);
            u.setStatus(status);
            return userRepository.save(u);
        });
    }

    @Test
    @DisplayName("Unauthenticated request to feature-controls API returns 401")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/feature-controls"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Buyer access to feature-controls returns 403")
    void testBuyerAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/feature-controls")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can fetch all feature controls")
    void testAdminFetchAllFeatures() throws Exception {
        mockMvc.perform(get("/api/v1/admin/feature-controls")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.features", not(empty())))
                .andExpect(jsonPath("$.features[*].impactWarning", notNullValue()))
                .andExpect(jsonPath("$.maintenanceModeActive", is(false)));
    }

    @Test
    @DisplayName("Dangerous feature flag requires explicit confirmation")
    void testDangerousFeatureRequiresConfirmation() throws Exception {
        UpdateFeatureFlagRequest unconfirmedReq = new UpdateFeatureFlagRequest(true, false);

        mockMvc.perform(put("/api/v1/admin/feature-controls/MAINTENANCE_MODE_ENABLED")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unconfirmedReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Disabling BUYER_REGISTRATION_ENABLED prevents new buyer registration")
    void testBuyerRegistrationDisabledEnforcement() throws Exception {
        // Disable buyer registration
        UpdateFeatureFlagRequest disableReq = new UpdateFeatureFlagRequest(false, true);
        mockMvc.perform(put("/api/v1/admin/feature-controls/BUYER_REGISTRATION_ENABLED")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(disableReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled", is(false)));

        // Attempt registration
        RegisterRequest regReq = new RegisterRequest(
                "New Buyer",
                "new_blocked_buyer@kemkendra.com",
                "Password123!",
                "+919876543210",
                true,
                true
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Buyer registration is currently disabled")));
    }
}
