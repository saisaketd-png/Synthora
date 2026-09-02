package com.kemkendra.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.SupplierVerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminOperationsSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User testAdmin;
    private User testBuyer;
    private User testSupplierUser;
    private Supplier testSupplier;

    @BeforeEach
    void setup() {
        testAdmin = new User();
        testAdmin.setId(UUID.randomUUID());
        testAdmin.setName("Platform Operations Admin");
        testAdmin.setEmail("admin-" + UUID.randomUUID() + "@kemkendra.com");
        testAdmin.setPasswordHash(passwordEncoder.encode("AdminSecret123!"));
        testAdmin.setRole(UserRole.ADMIN);
        testAdmin.setStatus(UserStatus.ACTIVE);
        testAdmin.setCreatedAt(Instant.now());
        testAdmin.setUpdatedAt(Instant.now());
        testAdmin = userRepository.save(testAdmin);

        testBuyer = new User();
        testBuyer.setId(UUID.randomUUID());
        testBuyer.setName("Procurement Buyer");
        testBuyer.setEmail("buyer-" + UUID.randomUUID() + "@pharma.com");
        testBuyer.setPasswordHash(passwordEncoder.encode("BuyerSecret123!"));
        testBuyer.setRole(UserRole.USER);
        testBuyer.setStatus(UserStatus.ACTIVE);
        testBuyer.setCreatedAt(Instant.now());
        testBuyer.setUpdatedAt(Instant.now());
        testBuyer = userRepository.save(testBuyer);

        testSupplierUser = new User();
        testSupplierUser.setId(UUID.randomUUID());
        testSupplierUser.setName("Global Chemical Supplier");
        testSupplierUser.setEmail("supplier-" + UUID.randomUUID() + "@chem.com");
        testSupplierUser.setPasswordHash(passwordEncoder.encode("SupplierSecret123!"));
        testSupplierUser.setRole(UserRole.SUPPLIER);
        testSupplierUser.setStatus(UserStatus.ACTIVE);
        testSupplierUser.setCreatedAt(Instant.now());
        testSupplierUser.setUpdatedAt(Instant.now());
        testSupplierUser = userRepository.save(testSupplierUser);

        testSupplier = new Supplier();
        testSupplier.setName("Global Chem Industries");
        testSupplier.setSlug("global-chem-" + UUID.randomUUID());
        testSupplier.setUser(testSupplierUser);
        testSupplier.setVerificationStatus(SupplierVerificationStatus.PENDING);
        testSupplier.setVerified(false);
        testSupplier.setCountryCode("IN");
        testSupplier.setCountryName("India");
        testSupplier = supplierRepository.save(testSupplier);
    }

    @Test
    @DisplayName("Admin can access live platform snapshot metrics with 200 OK")
    @WithMockUser(username = "admin@kemkendra.com", roles = {"ADMIN"})
    void testAdminCanAccessPlatformSnapshot() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.totalUsers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.users.adminCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.suppliers.totalSuppliers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.catalog", notNullValue()))
                .andExpect(jsonPath("$.marketplace", notNullValue()))
                .andExpect(jsonPath("$.governance", notNullValue()));
    }

    @Test
    @DisplayName("Admin can access operational attention queue")
    @WithMockUser(username = "admin@kemkendra.com", roles = {"ADMIN"})
    void testAdminCanAccessAttentionQueue() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/attention-queue")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    @DisplayName("Admin can access marketplace quotation and shipment operations")
    @WithMockUser(username = "admin@kemkendra.com", roles = {"ADMIN"})
    void testAdminCanAccessMarketplaceFeeds() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/marketplace/quotations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()));

        mockMvc.perform(get("/api/v1/admin/operations/marketplace/shipments")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", notNullValue()));
    }

    @Test
    @DisplayName("Buyer (USER) receives 403 Forbidden on all operations endpoints")
    @WithMockUser(username = "buyer@pharma.com", roles = {"USER"})
    void testBuyerForbiddenFromOperations() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/operations/attention-queue"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/suppliers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Supplier receives 403 Forbidden on all operations endpoints")
    @WithMockUser(username = "supplier@chem.com", roles = {"SUPPLIER"})
    void testSupplierForbiddenFromOperations() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/operations/attention-queue"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/suppliers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated client receives 401 Unauthorized on admin operations")
    void testUnauthenticatedDenied() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/suppliers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("User Directory and User Detail never expose password hashes or sensitive tokens")
    @WithMockUser(username = "admin@kemkendra.com", roles = {"ADMIN"})
    void testUserDirectoryNeverExposesSecrets() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.content[0].password").doesNotExist())
                .andExpect(jsonPath("$.content[0].token").doesNotExist());

        mockMvc.perform(get("/api/v1/admin/users/" + testBuyer.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Procurement Buyer")))
                .andExpect(jsonPath("$.email", is(testBuyer.getEmail())))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("Supplier Detail endpoint returns enriched operational profile")
    @WithMockUser(username = "admin@kemkendra.com", roles = {"ADMIN"})
    void testSupplierDetailEnriched() throws Exception {
        mockMvc.perform(get("/api/v1/admin/suppliers/" + testSupplier.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Global Chem Industries")))
                .andExpect(jsonPath("$.countryCode", is("IN")))
                .andExpect(jsonPath("$.offeringCount", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.rfqReceivedCount", greaterThanOrEqualTo(0)));
    }
}
