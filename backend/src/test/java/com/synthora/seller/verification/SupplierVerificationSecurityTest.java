package com.synthora.seller.verification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.seller.SupplierVerificationStatus;
import com.synthora.seller.verification.dto.RejectSupplierRequest;
import com.synthora.seller.verification.dto.RequestInfoRequest;
import com.synthora.seller.verification.dto.SupplierResponseRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
public class SupplierVerificationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User supplierUserA;
    private User supplierUserB;
    private User adminUser;
    private User buyerUser;
    private Supplier supplierA;
    private Supplier supplierB;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        supplierUserA = new User(
                UUID.randomUUID(),
                "Supplier Alpha",
                "supplier.a@example.com",
                "+111111111",
                "password123",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setUser(supplierUserA);
        supplierA.setName("Alpha Chemicals Ltd");
        supplierA.setSlug("alpha-chem");
        supplierA.setCountryCode("US");
        supplierA.setCountryName("United States");
        supplierA.setVerified(false);
        supplierA.setLegalName("Alpha Chemicals Inc");
        supplierA.setBusinessType("MANUFACTURER");
        supplierA.setVerificationStatus(SupplierVerificationStatus.DRAFT);
        supplierRepository.save(supplierA);

        supplierUserB = new User(
                UUID.randomUUID(),
                "Supplier Beta",
                "supplier.b@example.com",
                "+222222222",
                "password123",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setUser(supplierUserB);
        supplierB.setName("Beta Solvents LLC");
        supplierB.setSlug("beta-solvents");
        supplierB.setCountryCode("DE");
        supplierB.setCountryName("Germany");
        supplierB.setVerified(false);
        supplierB.setLegalName("Beta Solvents GmbH");
        supplierB.setBusinessType("DISTRIBUTOR");
        supplierB.setVerificationStatus(SupplierVerificationStatus.DRAFT);
        supplierRepository.save(supplierB);

        adminUser = new User(
                UUID.randomUUID(),
                "Admin Officer",
                "admin.verifier@example.com",
                "+333333333",
                "password123",
                UserRole.ADMIN,
                UserStatus.ACTIVE
        );
        userRepository.save(adminUser);

        buyerUser = new User(
                UUID.randomUUID(),
                "Procurement Buyer",
                "buyer@example.com",
                "+444444444",
                "password123",
                UserRole.USER,
                UserStatus.ACTIVE
        );
        userRepository.save(buyerUser);
    }

    @Test
    @WithMockUser(username = "supplier.a@example.com", roles = {"SUPPLIER"})
    void supplierCanGetOwnVerificationWorkspace() throws Exception {
        mockMvc.perform(get("/api/v1/supplier/verification"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplierId").value(supplierA.getId()))
                .andExpect(jsonPath("$.companyName").value("Alpha Chemicals Ltd"))
                .andExpect(jsonPath("$.verificationStatus").value("DRAFT"))
                .andExpect(jsonPath("$.checklist").isArray());
    }

    @Test
    @WithMockUser(username = "supplier.a@example.com", roles = {"SUPPLIER"})
    void supplierCanSubmitInitialVerification() throws Exception {
        mockMvc.perform(post("/api/v1/supplier/verification/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("PENDING"));

        Supplier updated = supplierRepository.findById(supplierA.getId()).orElseThrow();
        assertThat(updated.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.PENDING);
    }

    @Test
    @WithMockUser(username = "supplier.a@example.com", roles = {"SUPPLIER"})
    void supplierCanRespondToInformationRequest() throws Exception {
        supplierA.setVerificationStatus(SupplierVerificationStatus.INFORMATION_REQUIRED);
        supplierA.setAdminRequestInfoNotes("Please provide updated tax document.");
        supplierRepository.save(supplierA);

        SupplierResponseRequest request = new SupplierResponseRequest("Updated tax document uploaded.");

        mockMvc.perform(post("/api/v1/supplier/verification/respond")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("UNDER_REVIEW"))
                .andExpect(jsonPath("$.supplierResponseNotes").value("Updated tax document uploaded."));
    }

    @Test
    @WithMockUser(username = "buyer@example.com", roles = {"USER"})
    void buyerCannotAccessSupplierVerification() throws Exception {
        mockMvc.perform(get("/api/v1/supplier/verification"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "supplier.a@example.com", roles = {"SUPPLIER"})
    void supplierCannotAccessAdminVerificationEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/suppliers/" + supplierB.getId() + "/verification"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/suppliers/" + supplierB.getId() + "/verification/finalize"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin.verifier@example.com", roles = {"ADMIN"})
    void adminCanReviewAndRequestInformation() throws Exception {
        supplierA.setVerificationStatus(SupplierVerificationStatus.PENDING);
        supplierRepository.save(supplierA);

        // 1. Start review
        mockMvc.perform(post("/api/v1/admin/suppliers/" + supplierA.getId() + "/verification/start-review"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("UNDER_REVIEW"));

        // 2. Request information
        RequestInfoRequest req = new RequestInfoRequest("Missing ISO certificate.");
        mockMvc.perform(post("/api/v1/admin/suppliers/" + supplierA.getId() + "/verification/request-info")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("INFORMATION_REQUIRED"))
                .andExpect(jsonPath("$.adminRequestNotes").value("Missing ISO certificate."));
    }

    @Test
    @WithMockUser(username = "admin.verifier@example.com", roles = {"ADMIN"})
    void adminCanRejectSupplierWithReason() throws Exception {
        RejectSupplierRequest req = new RejectSupplierRequest("Fraudulent registration details.");

        mockMvc.perform(post("/api/v1/admin/suppliers/" + supplierB.getId() + "/verification/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.verificationNotes").value("Fraudulent registration details."));

        Supplier updated = supplierRepository.findById(supplierB.getId()).orElseThrow();
        assertThat(updated.getVerificationStatus()).isEqualTo(SupplierVerificationStatus.REJECTED);
        assertThat(updated.getVerified()).isFalse();
    }
}
