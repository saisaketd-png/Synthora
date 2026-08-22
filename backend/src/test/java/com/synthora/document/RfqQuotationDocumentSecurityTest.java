package com.synthora.document;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.product.ProductRepository;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RfqQuotationDocumentSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User buyer1;
    private User buyer2;
    private User supplier1User;
    private User supplier2User;
    private Supplier supplier1;
    private String buyer1Token;
    private String buyer2Token;
    private String supplier1Token;
    private String supplier2Token;

    private Rfq testRfq;
    private Quotation testQuotation;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        buyer1 = new User();
        buyer1.setEmail("buyer1@test.com");
        buyer1.setName("Buyer 1");
        buyer1.setPasswordHash("hash");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        buyer2 = new User();
        buyer2.setEmail("buyer2@test.com");
        buyer2.setName("Buyer 2");
        buyer2.setPasswordHash("hash");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        supplier1User = new User();
        supplier1User.setEmail("supp1@test.com");
        supplier1User.setName("Supp 1");
        supplier1User.setPasswordHash("hash");
        supplier1User.setRole(UserRole.SUPPLIER);
        supplier1User.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        supplier1User = userRepository.save(supplier1User);
        supplier1Token = jwtService.generateToken(supplier1User);

        supplier1 = new Supplier();
        supplier1.setUser(supplier1User);
        supplier1.setName("Company 1");
        supplier1.setSlug("company-1");
        supplier1.setCountryCode("US");
        supplier1.setCountryName("United States");
        supplier1 = supplierRepository.save(supplier1);

        supplier2User = new User();
        supplier2User.setEmail("supp2@test.com");
        supplier2User.setName("Supp 2");
        supplier2User.setPasswordHash("hash");
        supplier2User.setRole(UserRole.SUPPLIER);
        supplier2User.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        supplier2User = userRepository.save(supplier2User);
        supplier2Token = jwtService.generateToken(supplier2User);

        testRfq = new Rfq();
        testRfq.setBuyerId(buyer1.getId());
        testRfq.setProductId(UUID.randomUUID());
        testRfq.setSupplierId(supplier1.getId());
        testRfq.setQuantity(new BigDecimal("100"));
        testRfq.setUnit("KG");
        testRfq.setStatus(RfqStatus.PENDING);
        testRfq = rfqRepository.save(testRfq);

        testQuotation = new Quotation();
        testQuotation.setRfq(testRfq);
        testQuotation.setQuotationVersion(1);
        testQuotation.setUnitPrice(new BigDecimal("10.5"));
        testQuotation.setCurrency("USD");
        testQuotation.setValidityDate(LocalDate.now().plusDays(30));
        testQuotation = quotationRepository.save(testQuotation);
    }

    private MockMultipartFile createMockFile() {
        return new MockMultipartFile("file", "test.pdf", "application/pdf", "%PDF-1.4 valid test pdf content".getBytes());
    }

    // --- RFQ Document Tests ---

    @Test
    public void buyerCanUploadRfqDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void unrelatedBuyerCannotUploadRfqDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void supplierAssignedCanUploadRfqDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void unrelatedSupplierCannotUploadRfqDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void supplierAssignedCanViewRfqDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + buyer1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk());
    }

    @Test
    public void supplierCannotDeleteBuyerRfqDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + buyer1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(delete("/api/v1/documents/" + docId)
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void supplierCanDeleteOwnUploadedRfqDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "TECHNICAL_SPECIFICATION")
                .header("Authorization", "Bearer " + supplier1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(delete("/api/v1/documents/" + docId)
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isNoContent());
    }

    // --- QUOTATION Document Tests ---

    @Test
    public void supplierCanUploadQuotationDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "QUOTATION")
                .param("ownerId", testQuotation.getId().toString())
                .param("category", "QUOTATION_ATTACHMENT")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void buyerCannotUploadQuotationDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "QUOTATION")
                .param("ownerId", testQuotation.getId().toString())
                .param("category", "QUOTATION_ATTACHMENT")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void buyerCanViewQuotationDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "QUOTATION")
                .param("ownerId", testQuotation.getId().toString())
                .param("category", "QUOTATION_ATTACHMENT")
                .header("Authorization", "Bearer " + supplier1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk());
    }

    @Test
    public void buyerCannotDeleteQuotationDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "QUOTATION")
                .param("ownerId", testQuotation.getId().toString())
                .param("category", "QUOTATION_ATTACHMENT")
                .header("Authorization", "Bearer " + supplier1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(delete("/api/v1/documents/" + docId)
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isForbidden());
    }

    // --- Category Validation Tests ---

    @Test
    public void validRfqCategoryAccepted() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "CERTIFICATION")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void invalidRfqCategoryRejected() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "RFQ")
                .param("ownerId", testRfq.getId().toString())
                .param("category", "INVOICE")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isBadRequest());
    }
}
