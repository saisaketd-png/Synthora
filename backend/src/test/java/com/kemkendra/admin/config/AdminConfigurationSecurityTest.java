package com.kemkendra.admin.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.admin.config.dto.AdminConfigDtos.UpdatePlatformSettingRequest;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminConfigurationSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private PlatformPolicyService policyService;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;
    private String suspendedToken;

    @BeforeEach
    void setUp() {
        policyService.clearCache();
        policyService.initDefaults();

        User admin = createTestUser("admin_cfg@kemkendra.com", UserRole.ADMIN, UserStatus.ACTIVE);
        adminToken = "Bearer " + jwtService.generateToken(admin);

        User buyer = createTestUser("buyer_cfg@kemkendra.com", UserRole.USER, UserStatus.ACTIVE);
        buyerToken = "Bearer " + jwtService.generateToken(buyer);

        User supplier = createTestUser("supplier_cfg@kemkendra.com", UserRole.SUPPLIER, UserStatus.ACTIVE);
        supplierToken = "Bearer " + jwtService.generateToken(supplier);

        User suspended = createTestUser("suspended_cfg@kemkendra.com", UserRole.ADMIN, UserStatus.SUSPENDED);
        suspendedToken = "Bearer " + jwtService.generateToken(suspended);
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
    @DisplayName("Unauthenticated request to settings API returns 401 Unauthorized")
    void testUnauthenticatedSettingsAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Buyer access to settings API returns 403 Forbidden")
    void testBuyerSettingsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Supplier access to settings API returns 403 Forbidden")
    void testSupplierSettingsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can fetch grouped platform settings with impact warnings")
    void testAdminFetchSettings() throws Exception {
        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groups", notNullValue()))
                .andExpect(jsonPath("$.groups", not(empty())))
                .andExpect(jsonPath("$.groups[*].settings[*].impactWarning", notNullValue()));
    }

    @Test
    @DisplayName("Admin can update integer platform setting with validation")
    void testAdminUpdateSetting() throws Exception {
        UpdatePlatformSettingRequest req = new UpdatePlatformSettingRequest("21");

        mockMvc.perform(put("/api/v1/admin/settings/QUOTATION_DEFAULT_VALIDITY_DAYS")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key", is("QUOTATION_DEFAULT_VALIDITY_DAYS")))
                .andExpect(jsonPath("$.value", is("21")))
                .andExpect(jsonPath("$.updatedBy", is("admin_cfg@kemkendra.com")));
    }

    @Test
    @DisplayName("Setting update rejects non-integer value for integer setting")
    void testInvalidIntegerSettingRejected() throws Exception {
        UpdatePlatformSettingRequest req = new UpdatePlatformSettingRequest("invalid-not-a-number");

        mockMvc.perform(put("/api/v1/admin/settings/QUOTATION_DEFAULT_VALIDITY_DAYS")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }
}
