package com.kemkendra.admin.announcement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.admin.config.dto.AdminConfigDtos.CreateAnnouncementRequest;
import com.kemkendra.admin.config.dto.AdminConfigDtos.UpdateAnnouncementRequest;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.NotificationRepository;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminAnnouncementSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private NotificationRepository notificationRepository;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    void setUp() {
        User admin = createTestUser("admin_ann@kemkendra.com", UserRole.ADMIN, UserStatus.ACTIVE);
        adminToken = "Bearer " + jwtService.generateToken(admin);

        User buyer = createTestUser("buyer_ann@kemkendra.com", UserRole.USER, UserStatus.ACTIVE);
        buyerToken = "Bearer " + jwtService.generateToken(buyer);

        User supplier = createTestUser("supplier_ann@kemkendra.com", UserRole.SUPPLIER, UserStatus.ACTIVE);
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
    @DisplayName("Unauthenticated request to announcements API returns 401")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/announcements"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Buyer access to announcements returns 403")
    void testBuyerAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/announcements")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can create, preview, publish, and deactivate announcement")
    void testAnnouncementLifecycle() throws Exception {
        CreateAnnouncementRequest createReq = new CreateAnnouncementRequest(
                "Scheduled Maintenance Notice",
                "Platform will undergo scheduled maintenance this Sunday from 02:00 to 04:00 UTC.",
                "WARNING",
                "ALL",
                true,
                false,
                null,
                null
        );

        // Preview
        mockMvc.perform(post("/api/v1/admin/announcements/preview")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Scheduled Maintenance Notice")))
                .andExpect(jsonPath("$.estimatedRecipientCount", greaterThanOrEqualTo(3)));

        // Create Draft
        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/announcements")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DRAFT")))
                .andExpect(jsonPath("$.title", is("Scheduled Maintenance Notice")))
                .andReturn();

        String respStr = createResult.getResponse().getContentAsString();
        UUID announcementId = UUID.fromString(objectMapper.readTree(respStr).get("id").asText());

        // Publish
        mockMvc.perform(post("/api/v1/admin/announcements/" + announcementId + "/publish")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("PUBLISHED")))
                .andExpect(jsonPath("$.publishedAt", notNullValue()));

        // Verify Notifications Created in Phase 1.14 Notification Engine
        long notifCount = notificationRepository.findAll().stream()
                .filter(n -> "Scheduled Maintenance Notice".equals(n.getTitle()))
                .count();
        assertTrue(notifCount >= 3, "Notifications should be dispatched to all users");

        // Deactivate
        mockMvc.perform(post("/api/v1/admin/announcements/" + announcementId + "/deactivate")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("DEACTIVATED")));
    }
}
