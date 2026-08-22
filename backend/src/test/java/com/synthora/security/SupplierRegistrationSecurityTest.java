package com.synthora.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.dto.LoginRequest;
import com.synthora.identity.dto.SupplierRegisterRequest;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
        userRepository.findByEmail("newsupplier@synthora.com").ifPresent(user -> userRepository.delete(user));
    }

    @Test
    @Transactional
    public void testSupplierRegistrationFlowAndSecurity() throws Exception {
        SupplierRegisterRequest request = new SupplierRegisterRequest(
                "Jane Doe",
                "newsupplier@synthora.com",
                "SecurePass123!",
                "Acme Chemicals",
                "Germany",
                "DE",
                "+4912345678",
                "Berlin",
                "https://acme-chem.de",
                "Leading supplier of chemical compounds."
        );

        // 1. Register Supplier
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/supplier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.message").value("Supplier registered successfully"))
                .andExpect(jsonPath("$.password").doesNotExist()) // Ensure password is never returned
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        // 2. Verify User stored correctly
        User savedUser = userRepository.findByEmail("newsupplier@synthora.com").orElseThrow();
        assertEquals(UserRole.SUPPLIER, savedUser.getRole());
        assertEquals("Jane Doe", savedUser.getName());
        assertTrue(savedUser.getPasswordHash().startsWith("$2a$") || savedUser.getPasswordHash().startsWith("$argon2")); // Should be hashed

        // 3. Verify Supplier profile stored correctly
        Supplier savedSupplier = supplierRepository.findByUser(savedUser).orElseThrow();
        assertEquals("Acme Chemicals", savedSupplier.getName());
        assertEquals("Germany", savedSupplier.getCountryName());

        // 4. Verify login using the new credentials
        LoginRequest loginRequest = new LoginRequest("newsupplier@synthora.com", "SecurePass123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()));
    }
}
