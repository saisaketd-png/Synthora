package com.synthora.seller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.seller.dto.UpdateSellerProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
public class SellerProfileSecurityTest {

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

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User supplierUser;
    private Supplier operationalSupplier;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        supplierUser = new User(
                UUID.randomUUID(),
                "Supplier John",
                "supplier@example.com",
                "+123456789",
                "hash",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(supplierUser);

        operationalSupplier = new Supplier();
        operationalSupplier.setUser(supplierUser);
        operationalSupplier.setName("Old Supplier Name");
        operationalSupplier.setSlug("old-supplier");
        operationalSupplier.setCountryName("Old Country");
        operationalSupplier.setCountryCode("OC");
        operationalSupplier.setVerified(true);
        operationalSupplier.setYearsInBusiness(10);
        operationalSupplier.setResponseRate(95);
        operationalSupplier.setExportReady(true);
        supplierRepository.save(operationalSupplier);
    }

    @Test
    @WithMockUser(username = "supplier@example.com", roles = "SUPPLIER")
    void testUpdateSellerProfile_SynchronizesSupplier() throws Exception {
        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "New Company Name",
                "GST-12345",
                "123 New St",
                "New City",
                "New State",
                "New Country",
                "https://newwebsite.com",
                "ISO 9001",
                "We are a great company"
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("New Company Name"))
                .andExpect(jsonPath("$.country").value("New Country"));

        Supplier updatedSupplier = supplierRepository.findByUser(supplierUser).orElseThrow();
        assertThat(updatedSupplier.getName()).isEqualTo("New Company Name");
        assertThat(updatedSupplier.getCountryName()).isEqualTo("New Country");
        // Operational fields untouched
        assertThat(updatedSupplier.getVerified()).isTrue();
        assertThat(updatedSupplier.getYearsInBusiness()).isEqualTo(10);
    }

    @Test
    @WithMockUser(username = "supplier@example.com", roles = "SUPPLIER")
    void testGetSellerProfile_ReturnsData() throws Exception {
        SellerProfile profile = new SellerProfile();
        profile.setUser(supplierUser);
        profile.setCompanyName("Existing Company");
        profile.setCountry("Existing Country");
        sellerProfileRepository.save(profile);

        mockMvc.perform(get("/api/v1/sellers/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Existing Company"));
    }

    @Test
    @WithMockUser(username = "buyer@example.com", roles = "BUYER")
    void testBuyerCannotUpdateSellerProfile() throws Exception {
        User buyerUser = new User(
                UUID.randomUUID(),
                "Buyer Bob",
                "buyer@example.com",
                "+987654321",
                "hash",
                UserRole.USER,
                UserStatus.ACTIVE
        );
        userRepository.save(buyerUser);

        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "Hack Company", null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedUserCannotUpdateSellerProfile() throws Exception {
        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "Hack Company", null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "supplier@example.com", roles = "SUPPLIER")
    void testUpdateSellerProfile_MissingSupplierThrowsDomainException() throws Exception {
        supplierRepository.deleteAll(); // Remove the operational supplier

        UpdateSellerProfileRequest request = new UpdateSellerProfileRequest(
                "New Company Name", null, null, null, null, "New Country", null, null, null
        );

        mockMvc.perform(put("/api/v1/sellers/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }
}
