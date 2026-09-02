package com.kemkendra.admin.taxonomy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.admin.config.dto.AdminConfigDtos.CreateTaxonomyRequest;
import com.kemkendra.admin.config.dto.AdminConfigDtos.UpdateTaxonomyRequest;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminTaxonomySecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    void setUp() {
        User admin = createTestUser("admin_tax@kemkendra.com", UserRole.ADMIN, UserStatus.ACTIVE);
        adminToken = "Bearer " + jwtService.generateToken(admin);

        User buyer = createTestUser("buyer_tax@kemkendra.com", UserRole.USER, UserStatus.ACTIVE);
        buyerToken = "Bearer " + jwtService.generateToken(buyer);

        User supplier = createTestUser("supplier_tax@kemkendra.com", UserRole.SUPPLIER, UserStatus.ACTIVE);
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
    @DisplayName("Unauthenticated request to taxonomy API returns 401")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/taxonomy"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Buyer access to taxonomy returns 403")
    void testBuyerAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/taxonomy")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Supplier access to taxonomy returns 403")
    void testSupplierAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/taxonomy")
                        .header("Authorization", supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can manage catalog taxonomy lifecycle")
    void testTaxonomyLifecycle() throws Exception {
        CreateTaxonomyRequest createReq = new CreateTaxonomyRequest(
                "PACKAGING",
                "Stainless Steel Tank (5000L)",
                "SS_TANK_5000L",
                "High-grade stainless steel chemical storage tank",
                10
        );

        // Create
        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/taxonomy")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type", is("PACKAGING")))
                .andExpect(jsonPath("$.code", is("SS_TANK_5000L")))
                .andExpect(jsonPath("$.active", is(true)))
                .andReturn();

        String respStr = createResult.getResponse().getContentAsString();
        UUID taxonomyId = UUID.fromString(objectMapper.readTree(respStr).get("id").asText());

        // Update
        UpdateTaxonomyRequest updateReq = new UpdateTaxonomyRequest(
                "Stainless Steel Tank (5000 Liters)",
                "Premium ASME-certified stainless steel chemical tank",
                true,
                11
        );

        mockMvc.perform(put("/api/v1/admin/taxonomy/" + taxonomyId)
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Stainless Steel Tank (5000 Liters)")));

        // Deactivate (Soft deactivation)
        mockMvc.perform(put("/api/v1/admin/taxonomy/" + taxonomyId + "/deactivate")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));

        // Activate
        mockMvc.perform(put("/api/v1/admin/taxonomy/" + taxonomyId + "/activate")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(true)));
    }
}
