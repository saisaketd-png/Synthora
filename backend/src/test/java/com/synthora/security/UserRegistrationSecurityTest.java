package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.RegisterRequest;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserRegistrationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @BeforeEach
    public void setup() {
        // Clean up test specific users if present
        Optional<User> existingBuyer = userRepository.findByEmail("newbuyer@example.com");
        existingBuyer.ifPresent(u -> userRepository.delete(u));

        Optional<User> existingSupplier = userRepository.findByEmail("newsupplier@chemcorp.com");
        existingSupplier.ifPresent(u -> {
            sellerProfileRepository.findByUser(u).ifPresent(sellerProfileRepository::delete);
            supplierRepository.findByUser(u).ifPresent(supplierRepository::delete);
            userRepository.delete(u);
        });
    }

    // =========================================================================
    // SECTION 1: BUYER REGISTRATION
    // =========================================================================

    @Test
    @DisplayName("1. Public buyer registration creates active user with USER role (201)")
    public void testBuyerRegistrationSuccess() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "Jane Buyer",
                "newbuyer@example.com",
                "+1-555-0199",
                "StrongPassword123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.email", is("newbuyer@example.com")))
                .andExpect(jsonPath("$.name", is("Jane Buyer")))
                .andExpect(jsonPath("$.role", is("USER")))
                .andExpect(jsonPath("$.status", is("ACTIVE")));

        User user = userRepository.findByEmail("newbuyer@example.com").orElseThrow();
        assertEquals(UserRole.USER, user.getRole());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertNotEquals("StrongPassword123!", user.getPasswordHash(), "Password must be securely hashed");
    }

    @Test
    @DisplayName("2. Duplicate email rejected on buyer registration (400)")
    public void testBuyerRegistrationDuplicateEmail() throws Exception {
        RegisterRequest req1 = new RegisterRequest(
                "First User",
                "newbuyer@example.com",
                "+1-555-0199",
                "StrongPassword123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        RegisterRequest req2 = new RegisterRequest(
                "Second User",
                "newbuyer@example.com",
                "+1-555-0200",
                "AnotherPassword123!"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("3. Buyer registration rejects invalid inputs (400)")
    public void testBuyerRegistrationValidation() throws Exception {
        // Short password (< 8 chars)
        RegisterRequest shortPw = new RegisterRequest("Name", "test@test.com", null, "short");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPw)))
                .andExpect(status().isBadRequest());

        // Blank name
        RegisterRequest blankName = new RegisterRequest("  ", "test@test.com", null, "ValidPassword123!");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankName)))
                .andExpect(status().isBadRequest());

        // Invalid email format
        RegisterRequest badEmail = new RegisterRequest("Name", "not-an-email", null, "ValidPassword123!");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badEmail)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("4. Privilege escalation attempt via extra fields ignored (assigned USER)")
    public void testBuyerPrivilegeEscalationDefense() throws Exception {
        String payloadWithRole = """
                {
                    "name": "Attacker",
                    "email": "newbuyer@example.com",
                    "password": "StrongPassword123!",
                    "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithRole))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role", is("USER")));

        User user = userRepository.findByEmail("newbuyer@example.com").orElseThrow();
        assertEquals(UserRole.USER, user.getRole(), "User role must remain USER regardless of client input");
    }

    // =========================================================================
    // SECTION 2: SUPPLIER REGISTRATION & ONBOARDING
    // =========================================================================

    @Test
    @DisplayName("5. Supplier registration provisions User, Supplier, and SellerProfile atomically (201)")
    public void testSupplierRegistrationSuccess() throws Exception {
        SupplierRegisterRequest req = new SupplierRegisterRequest(
                "Marcus Vance",
                "newsupplier@chemcorp.com",
                "SupplierSecurePass123!",
                "Vance Chemical Solutions",
                "Germany",
                "DE",
                "+49-30-123456",
                "Berlin",
                "https://vance-chem.de",
                "Leading European manufacturer of pharmaceutical intermediates and fine chemicals."
        );

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.message", containsString("registered successfully")))
                .andReturn();

        // 1. Verify User entity
        User user = userRepository.findByEmail("newsupplier@chemcorp.com").orElseThrow();
        assertEquals("Marcus Vance", user.getName());
        assertEquals(UserRole.SUPPLIER, user.getRole());
        assertEquals(UserStatus.ACTIVE, user.getStatus());

        // 2. Verify Operational Supplier entity
        Supplier supplier = supplierRepository.findByUser(user).orElseThrow();
        assertEquals("Vance Chemical Solutions", supplier.getName());
        assertEquals("Germany", supplier.getCountryName());
        assertEquals("DE", supplier.getCountryCode());
        assertFalse(supplier.getVerified());
        assertNotNull(supplier.getSlug());
        assertTrue(supplier.getSlug().startsWith("vance-chemical-solutions"));

        // 3. Verify Editable SellerProfile entity
        SellerProfile profile = sellerProfileRepository.findByUser(user).orElseThrow();
        assertEquals("Vance Chemical Solutions", profile.getCompanyName());
        assertEquals("Germany", profile.getCountry());
        assertEquals("Berlin", profile.getCity());
        assertEquals("https://vance-chem.de", profile.getWebsite());
        assertEquals("Leading European manufacturer of pharmaceutical intermediates and fine chemicals.", profile.getAboutCompany());

        // 4. Verify Immediate Authenticated Access with Token
        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        mockMvc.perform(get("/api/v1/sellers/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName", is("Vance Chemical Solutions")))
                .andExpect(jsonPath("$.country", is("Germany")));
    }

    @Test
    @DisplayName("6. Duplicate email rejected on supplier registration (400)")
    public void testSupplierRegistrationDuplicateEmail() throws Exception {
        SupplierRegisterRequest req1 = new SupplierRegisterRequest(
                "Marcus Vance",
                "newsupplier@chemcorp.com",
                "SupplierSecurePass123!",
                "Vance Chemical Solutions",
                "Germany",
                "DE",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        SupplierRegisterRequest req2 = new SupplierRegisterRequest(
                "Duplicate Person",
                "newsupplier@chemcorp.com",
                "AnotherPassword123!",
                "Another Company",
                "France",
                "FR",
                null, null, null, null
        );

        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("7. Supplier registration validates required fields (400)")
    public void testSupplierRegistrationValidation() throws Exception {
        // Missing company name
        SupplierRegisterRequest noCompany = new SupplierRegisterRequest(
                "Name", "newsupplier@chemcorp.com", "Password123!", "", "Germany", "DE", null, null, null, null
        );
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noCompany)))
                .andExpect(status().isBadRequest());

        // Missing country
        SupplierRegisterRequest noCountry = new SupplierRegisterRequest(
                "Name", "newsupplier@chemcorp.com", "Password123!", "Company", "", "DE", null, null, null, null
        );
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noCountry)))
                .andExpect(status().isBadRequest());

        // Password too short
        SupplierRegisterRequest shortPw = new SupplierRegisterRequest(
                "Name", "newsupplier@chemcorp.com", "short", "Company", "Germany", "DE", null, null, null, null
        );
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPw)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // SECTION 3: LOGIN WITH NEWLY REGISTERED ACCOUNTS
    // =========================================================================

    @Test
    @DisplayName("8. Newly registered buyer and supplier can log in via standard /api/v1/auth/login")
    public void testLoginWithRegisteredCredentials() throws Exception {
        // Register Buyer
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Buyer User", "newbuyer@example.com", null, "ValidPassword123!"
                        ))))
                .andExpect(status().isCreated());

        // Login as Buyer
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(
                                "newbuyer@example.com", "ValidPassword123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // Register Supplier
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SupplierRegisterRequest(
                                "Supplier User", "newsupplier@chemcorp.com", "SupplierPassword123!",
                                "ChemCorp Global", "USA", "US", null, null, null, null
                        ))))
                .andExpect(status().isCreated());

        // Login as Supplier
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(
                                "newsupplier@chemcorp.com", "SupplierPassword123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
