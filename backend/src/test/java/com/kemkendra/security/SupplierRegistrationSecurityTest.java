package com.kemkendra.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.dto.LoginRequest;
import com.kemkendra.identity.dto.SupplierRegisterRequest;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SupplierRegistrationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @BeforeEach
    public void setup() {
        userRepository.findByEmail("newsupplier@kemkendra.com").ifPresent(user -> userRepository.delete(user));
    }

    @Test
    @Transactional
    public void testSupplierRegistrationFlowAndSecurity() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "Jane Doe",
                "newsupplier@kemkendra.com",
                "SecurePass123!",
                "Acme Chemicals",
                "Germany",
                "DE",
                "+4912345678",
                "Berlin",
                "https://acme-chem.de",
                "Leading supplier of chemical compounds.",
                true,
                true
        );

        // 1. Register Supplier (returns 201 Created with message and supplier ID, NO token)
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.message").value("Supplier registered successfully. Please verify your email before logging in."))
                .andExpect(jsonPath("$.password").doesNotExist()) // Ensure password is never returned
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        // 2. Verify User stored correctly
        User savedUser = userRepository.findByEmail("newsupplier@kemkendra.com").orElseThrow();
        assertEquals(UserRole.SUPPLIER, savedUser.getRole());
        assertEquals("Jane Doe", savedUser.getName());
        assertNull(savedUser.getEmailVerifiedAt());
        assertTrue(savedUser.getPasswordHash().startsWith("$2a$") || savedUser.getPasswordHash().startsWith("$argon2")); // Should be hashed

        // 3. Verify Supplier profile stored correctly
        Supplier savedSupplier = supplierRepository.findByUser(savedUser).orElseThrow();
        assertEquals("Acme Chemicals", savedSupplier.getName());
        assertEquals("Germany", savedSupplier.getCountryName());

        // 4. Verify email to permit authenticated login
        savedUser.setEmailVerifiedAt(Instant.now());
        userRepository.save(savedUser);

        // 5. Verify login using the new credentials
        LoginRequest loginRequest = new LoginRequest("newsupplier@kemkendra.com", "SecurePass123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    @DisplayName("Multiple suppliers can register using the same mobile number (e.g. Supplier A, B, C)")
    void testMultipleSuppliers_sameMobileNumberAllowed() throws Exception {
        String sharedMobile = "9876543210";

        // Supplier A
        SupplierRegisterRequest supplierA = new SupplierRegisterRequest(
                "Supplier A Contact",
                "supplier.a@kemkendra-corp.com",
                "SecurePass123!",
                "Supplier A Chemicals Ltd",
                "India",
                "IN",
                sharedMobile,
                "Mumbai",
                null,
                null,
                true,
                true
        );
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supplierA)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplierId", notNullValue()));

        // Supplier B with same mobile
        SupplierRegisterRequest supplierB = new SupplierRegisterRequest(
                "Supplier B Contact",
                "supplier.b@kemkendra-corp.com",
                "SecurePass123!",
                "Supplier B Organics Ltd",
                "India",
                "IN",
                sharedMobile,
                "Gujarat",
                null,
                null,
                true,
                true
        );
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supplierB)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplierId", notNullValue()));

        // Supplier C with same mobile
        SupplierRegisterRequest supplierC = new SupplierRegisterRequest(
                "Supplier C Contact",
                "supplier.c@kemkendra-corp.com",
                "SecurePass123!",
                "Supplier C Pharma Ltd",
                "India",
                "IN",
                sharedMobile,
                "Hyderabad",
                null,
                null,
                true,
                true
        );
        mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supplierC)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.supplierId", notNullValue()));

        // Verify all 3 users exist with the same mobile number but unique emails
        User userA = userRepository.findByEmail("supplier.a@kemkendra-corp.com").orElseThrow();
        User userB = userRepository.findByEmail("supplier.b@kemkendra-corp.com").orElseThrow();
        User userC = userRepository.findByEmail("supplier.c@kemkendra-corp.com").orElseThrow();

        assertEquals(sharedMobile, userA.getPhone());
        assertEquals(sharedMobile, userB.getPhone());
        assertEquals(sharedMobile, userC.getPhone());
        assertNotEquals(userA.getId(), userB.getId());
        assertNotEquals(userB.getId(), userC.getId());
    }
}
