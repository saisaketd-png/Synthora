package com.kemkendra.product;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.seller.SellerProfile;
import com.kemkendra.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SupplierDiscoveryTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");
        
        User user1 = new User();
        user1.setEmail("sup1@test.com");
        user1.setPasswordHash("hash");
        user1.setRole(UserRole.SUPPLIER);
        user1.setName("User 1");
        user1 = userRepository.save(user1);

        Supplier s1 = new Supplier();
        s1.setName("Acme Corp");
        s1.setSlug("acme-corp");
        s1.setCountryCode("US");
        s1.setCountryName("United States");
        s1.setVerified(true);
        s1.setExportReady(true);
        s1.setUser(user1);
        supplierRepository.save(s1);

        SellerProfile p1 = new SellerProfile();
        p1.setUser(user1);
        p1.setCompanyName("Acme Corp");
        p1.setGstNumber("GST123");
        p1.setAboutCompany("We make anvils");
        sellerProfileRepository.save(p1);

        User user2 = new User();
        user2.setEmail("sup2@test.com");
        user2.setPasswordHash("hash");
        user2.setRole(UserRole.SUPPLIER);
        user2.setName("User 2");
        user2 = userRepository.save(user2);

        Supplier s2 = new Supplier();
        s2.setName("Globex");
        s2.setSlug("globex");
        s2.setCountryCode("IN");
        s2.setCountryName("India");
        s2.setVerified(false);
        s2.setExportReady(false);
        s2.setUser(user2);
        supplierRepository.save(s2);

        SellerProfile p2 = new SellerProfile();
        p2.setUser(user2);
        p2.setCompanyName("Globex");
        p2.setGstNumber("GST456");
        p2.setAboutCompany("Global exports");
        sellerProfileRepository.save(p2);
    }

    @Test
    public void testPublicSupplierListingSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].gstNumber").doesNotExist())
                .andExpect(jsonPath("$.content[0].userId").doesNotExist())
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.content[0].email").doesNotExist());
    }

    @Test
    public void testPublicSupplierDetailSucceeds() throws Exception {
        Supplier s = supplierRepository.findAll().get(0);
        
        mockMvc.perform(get("/api/v1/suppliers/" + s.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is(s.getName())))
                .andExpect(jsonPath("$.gstNumber").doesNotExist())
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    public void testSearchByCompanyName() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers?search=acme")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Acme Corp")));
    }

    @Test
    public void testFilterByCountry() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers?country=IN")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Globex")));
    }

    @Test
    public void testFilterByVerified() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers?verified=true")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Acme Corp")));
    }
    
    @Test
    public void testFilterByExportReady() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers?exportReady=false")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Globex")));
    }

    @Test
    public void testPaginationWorks() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers?page=0&size=1&sort=name,asc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Acme Corp")))
                .andExpect(jsonPath("$.totalPages", is(2)));
    }

    @Test
    public void testSortingWorks() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers?sort=name,desc")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name", is("Globex")));
    }

    @Test
    public void testUnknownSupplierReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/999999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testPostSupplierNotExposed() throws Exception {
        mockMvc.perform(post("/api/v1/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
