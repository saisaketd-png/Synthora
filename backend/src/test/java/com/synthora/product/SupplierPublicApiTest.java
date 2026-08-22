package com.synthora.product;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.seller.SellerProfile;
import com.synthora.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SupplierPublicApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Supplier operationalSupplier;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        User supplierUser = new User(
                UUID.randomUUID(),
                "Supplier Jane",
                "jane@example.com",
                "+111222333",
                "hash",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(supplierUser);

        operationalSupplier = new Supplier();
        operationalSupplier.setUser(supplierUser);
        operationalSupplier.setName("Jane Corp");
        operationalSupplier.setSlug("jane-corp");
        operationalSupplier.setCountryName("Germany");
        operationalSupplier.setCountryCode("DE");
        operationalSupplier.setVerified(true);
        operationalSupplier.setYearsInBusiness(5);
        operationalSupplier.setResponseRate(99);
        operationalSupplier.setExportReady(true);
        supplierRepository.save(operationalSupplier);

        SellerProfile profile = new SellerProfile();
        profile.setUser(supplierUser);
        profile.setCompanyName("Jane Corp");
        profile.setGstNumber("GST-SECRET"); // Should not be exposed
        profile.setCountry("Germany");
        profile.setAboutCompany("Jane Corp is great");
        profile.setWebsite("https://janecorp.de");
        profile.setCertifications("ISO 14001");
        sellerProfileRepository.save(profile);
    }

    @Test
    void testGetPublicSupplier_Success() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + operationalSupplier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(operationalSupplier.getId()))
                .andExpect(jsonPath("$.name").value("Jane Corp"))
                .andExpect(jsonPath("$.countryName").value("Germany"))
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.aboutCompany").value("Jane Corp is great"))
                .andExpect(jsonPath("$.website").value("https://janecorp.de"))
                .andExpect(jsonPath("$.certifications").value("ISO 14001"))
                // Ensure internal user id is NOT exposed
                .andExpect(jsonPath("$.userId").doesNotExist())
                // Ensure GST is NOT exposed
                .andExpect(jsonPath("$.gstNumber").doesNotExist());
    }

    @Test
    void testGetPublicSupplier_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testPublicSupplierDoesNotPermitMutation() throws Exception {
        mockMvc.perform(put("/api/v1/suppliers/" + operationalSupplier.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
