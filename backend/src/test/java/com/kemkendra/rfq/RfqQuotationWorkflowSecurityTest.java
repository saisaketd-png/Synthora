package com.kemkendra.rfq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.product.*;
import com.kemkendra.product.dto.SupplierPerformanceResponse;
import com.kemkendra.rfq.dto.CreateQuotationRequest;
import com.kemkendra.rfq.dto.CreateRfqRequest;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.security.JwtService;
import com.kemkendra.seller.SupplierPerformanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RfqQuotationWorkflowSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private SupplierPerformanceService supplierPerformanceService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User buyerA;
    private String buyerAToken;
    private User buyerB;
    private String buyerBToken;

    private User supplierUserA;
    private String supplierAToken;
    private Supplier supplierA;

    private User supplierUserB;
    private String supplierBToken;
    private Supplier supplierB;

    private MasterProduct activeMasterProduct;
    private MasterProduct inactiveMasterProduct;
    private SupplierOffering offeringA;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // Buyer A
        buyerA = new User();
        buyerA.setEmail("buyer.a@pharma.com");
        buyerA.setName("Buyer Alpha Corp");
        buyerA.setPasswordHash("hash123");
        buyerA.setRole(UserRole.USER);
        buyerA.setStatus(UserStatus.ACTIVE);
        buyerA = userRepository.save(buyerA);
        buyerAToken = jwtService.generateToken(buyerA);

        // Buyer B
        buyerB = new User();
        buyerB.setEmail("buyer.b@biotech.com");
        buyerB.setName("Buyer Beta Labs");
        buyerB.setPasswordHash("hash123");
        buyerB.setRole(UserRole.USER);
        buyerB.setStatus(UserStatus.ACTIVE);
        buyerB = userRepository.save(buyerB);
        buyerBToken = jwtService.generateToken(buyerB);

        // Supplier A
        supplierUserA = new User();
        supplierUserA.setEmail("supplier.a@chemchem.com");
        supplierUserA.setName("Supplier A Manager");
        supplierUserA.setPasswordHash("hash123");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA.setStatus(UserStatus.ACTIVE);
        supplierUserA = userRepository.save(supplierUserA);
        supplierAToken = jwtService.generateToken(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Acme Chemical Synthetics Ltd");
        supplierA.setUser(supplierUserA);
        supplierA.setCountryName("India");
        supplierA.setCountryCode("IN");
        supplierA.setVerified(true);
        supplierA = supplierRepository.save(supplierA);

        // Supplier B
        supplierUserB = new User();
        supplierUserB.setEmail("supplier.b@chemchem.com");
        supplierUserB.setName("Supplier B Manager");
        supplierUserB.setPasswordHash("hash123");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB.setStatus(UserStatus.ACTIVE);
        supplierUserB = userRepository.save(supplierUserB);
        supplierBToken = jwtService.generateToken(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Beta Intermediates Corp");
        supplierB.setUser(supplierUserB);
        supplierB.setCountryName("Germany");
        supplierB.setCountryCode("DE");
        supplierB.setVerified(true);
        supplierB = supplierRepository.save(supplierB);

        // Active Master Product
        activeMasterProduct = new MasterProduct();
        activeMasterProduct.setMasterProductCode("MP-TEST-001");
        activeMasterProduct.setName("Paracetamol IP Grade");
        activeMasterProduct.setCasNumber("103-90-2");
        activeMasterProduct.setMolecularFormula("C8H9NO2");
        activeMasterProduct.setCategory(ProductCategory.API);
        activeMasterProduct.setStatus("ACTIVE");
        activeMasterProduct = masterProductRepository.save(activeMasterProduct);

        // Inactive Master Product
        inactiveMasterProduct = new MasterProduct();
        inactiveMasterProduct.setMasterProductCode("MP-TEST-002");
        inactiveMasterProduct.setName("Banned Intermediate X");
        inactiveMasterProduct.setCasNumber("999-99-9");
        inactiveMasterProduct.setCategory(ProductCategory.INTERMEDIATE);
        inactiveMasterProduct.setStatus("INACTIVE");
        inactiveMasterProduct = masterProductRepository.save(inactiveMasterProduct);

        // Offering A
        offeringA = new SupplierOffering();
        offeringA.setMasterProduct(activeMasterProduct);
        offeringA.setSupplier(supplierA);
        offeringA.setPrice(new BigDecimal("120.00"));
        offeringA.setCurrency("INR");
        offeringA.setStock(5000);
        offeringA.setMoqKg(new BigDecimal("100"));
        offeringA.setPurity(new BigDecimal("99.5"));
        offeringA.setGrade("Pharma Grade");
        offeringA.setAvailabilityStatus("AVAILABLE");
        offeringA.setModerationStatus("APPROVED");
        offeringA = supplierOfferingRepository.save(offeringA);
    }

    @Test
    @DisplayName("1. Buyer creates valid RFQ for offering")
    public void testBuyerCreatesValidRfq() throws Exception {
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("500.00"),
                "kg",
                "Require GMP certified batch.",
                14
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.rfqReference").exists())
                .andExpect(jsonPath("$.supplierId").value(supplierA.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("2. Buyer cannot create RFQ for inactive MasterProduct")
    public void testBuyerCannotCreateRfqForInactiveMasterProduct() throws Exception {
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                inactiveMasterProduct.getId(),
                null,
                supplierA.getId(),
                null,
                new BigDecimal("100.00"),
                "kg",
                "Test message",
                7
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("3 & 4 & 5. MasterProduct and SupplierOffering mismatch or wrong supplier rejected")
    public void testOfferingIntegrityAndMismatchRejected() throws Exception {
        // Mismatched supplier (Offering belongs to supplierA, but buyer asks supplierB)
        CreateRfqRequest request1 = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierB.getId(),
                null,
                new BigDecimal("100.00"),
                "kg",
                "Test message",
                7
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isBadRequest());

        // Mismatched MasterProduct
        CreateRfqRequest request2 = new CreateRfqRequest(
                null,
                inactiveMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("100.00"),
                "kg",
                "Test message",
                7
        );

        mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6 & 7 & 8. IDOR protection: Buyer cannot access another buyer's RFQ; Supplier cannot access another supplier's RFQ")
    public void testRfqAccessAuthorizationAndIdor() throws Exception {
        // Buyer A creates RFQ to Supplier A
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("200.00"),
                "kg",
                "Buyer A inquiry",
                7
        );

        MvcResult result = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String rfqIdStr = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
        UUID rfqId = UUID.fromString(rfqIdStr);

        // Buyer A can read own RFQ
        mockMvc.perform(get("/api/v1/rfqs/" + rfqId)
                        .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isOk());

        // Buyer B CANNOT read Buyer A's RFQ (404/403)
        mockMvc.perform(get("/api/v1/rfqs/" + rfqId)
                        .header("Authorization", "Bearer " + buyerBToken))
                .andExpect(status().isNotFound());

        // Supplier A can read RFQ addressed to Supplier A
        mockMvc.perform(get("/api/v1/rfqs/supplier/" + rfqId)
                        .header("Authorization", "Bearer " + supplierAToken))
                .andExpect(status().isOk());

        // Supplier B CANNOT read RFQ addressed to Supplier A
        mockMvc.perform(get("/api/v1/rfqs/supplier/" + rfqId)
                        .header("Authorization", "Bearer " + supplierBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("9 & 10. Supplier submits quotation; Supplier B cannot submit quotation to Supplier A's RFQ")
    public void testSupplierQuotationSubmissionAndAuthorization() throws Exception {
        // Buyer A creates RFQ
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("250.00"),
                "kg",
                "Inquiry",
                10
        );

        MvcResult result = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID rfqId = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());

        // Supplier B tries to submit quotation -> 404 (IDOR protected)
        CreateQuotationRequest quoteReqB = new CreateQuotationRequest(
                new BigDecimal("115.00"),
                "INR",
                new BigDecimal("100"),
                5,
                LocalDate.now().plusDays(30),
                "25kg fibre drums",
                "Direct quote"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReqB)))
                .andExpect(status().isNotFound());

        // Supplier A submits valid quotation
        CreateQuotationRequest quoteReqA = new CreateQuotationRequest(
                new BigDecimal("118.50"),
                "INR",
                new BigDecimal("50"),
                7,
                LocalDate.now().plusDays(20),
                "25kg HDPE drums",
                "Best commercial quote"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReqA)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.quotationVersion").value(1))
                .andExpect(jsonPath("$.unitPrice").value(118.50))
                .andExpect(jsonPath("$.currency").value("INR"));

        // Verify RFQ status transitioned to QUOTED
        Rfq updatedRfq = rfqRepository.findById(rfqId).orElseThrow();
        assertThat(updatedRfq.getStatus()).isEqualTo(RfqStatus.QUOTED);
    }

    @Test
    @DisplayName("11 to 16. Buyer accepts valid quotation, rejects expired quotation, and rejects IDOR acceptance")
    public void testQuotationAcceptanceAndExpiryValidation() throws Exception {
        // Buyer A creates RFQ
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("300.00"),
                "kg",
                "Immediate dispatch needed",
                10
        );

        MvcResult rfqResult = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID rfqId = UUID.fromString(objectMapper.readTree(rfqResult.getResponse().getContentAsString()).get("id").asText());

        // Supplier A submits quotation with validity in the future
        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("112.00"),
                "INR",
                new BigDecimal("100"),
                4,
                LocalDate.now().plusDays(15),
                "Standard drums",
                "Valid quote"
        );

        MvcResult quoteResult = mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID quotationId = UUID.fromString(objectMapper.readTree(quoteResult.getResponse().getContentAsString()).get("id").asText());

        // Buyer B CANNOT accept Buyer A's quotation -> 404
        mockMvc.perform(post("/api/v1/rfqs/" + rfqId + "/quotations/" + quotationId + "/accept")
                        .header("Authorization", "Bearer " + buyerBToken))
                .andExpect(status().isNotFound());

        // Buyer A accepts quotation
        mockMvc.perform(post("/api/v1/rfqs/" + rfqId + "/quotations/" + quotationId + "/accept")
                        .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("ACCEPTED"));

        // Verify RFQ status is ACCEPTED
        Rfq acceptedRfq = rfqRepository.findById(rfqId).orElseThrow();
        assertThat(acceptedRfq.getStatus()).isEqualTo(RfqStatus.ACCEPTED);
        assertThat(acceptedRfq.getAcceptedQuotationId()).isEqualTo(quotationId);

        // Cannot accept again
        mockMvc.perform(post("/api/v1/rfqs/" + rfqId + "/quotations/" + quotationId + "/accept")
                        .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("14. Expired quotation cannot be accepted")
    public void testExpiredQuotationCannotBeAccepted() throws Exception {
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("100.00"),
                "kg",
                "Inquiry",
                10
        );

        MvcResult rfqResult = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID rfqId = UUID.fromString(objectMapper.readTree(rfqResult.getResponse().getContentAsString()).get("id").asText());

        // Supplier submits quotation with valid date, then we backdate validity date in DB to test expiry enforcement
        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("110.00"),
                "INR",
                new BigDecimal("50"),
                3,
                LocalDate.now().plusDays(5),
                "Drums",
                "Notes"
        );

        MvcResult quoteResult = mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID quotationId = UUID.fromString(objectMapper.readTree(quoteResult.getResponse().getContentAsString()).get("id").asText());

        // Backdate validity date in DB
        Quotation persistedQuote = quotationRepository.findById(quotationId).orElseThrow();
        persistedQuote.setValidityDate(LocalDate.now().minusDays(2));
        quotationRepository.save(persistedQuote);

        // Buyer tries to accept expired quotation -> 409 Conflict
        mockMvc.perform(post("/api/v1/rfqs/" + rfqId + "/quotations/" + quotationId + "/accept")
                        .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("16. Buyer can reject quotation")
    public void testBuyerCanRejectQuotation() throws Exception {
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("100.00"),
                "kg",
                "Inquiry",
                10
        );

        MvcResult rfqResult = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID rfqId = UUID.fromString(objectMapper.readTree(rfqResult.getResponse().getContentAsString()).get("id").asText());

        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("120.00"),
                "INR",
                new BigDecimal("50"),
                5,
                LocalDate.now().plusDays(10),
                "Drums",
                "Rejection test"
        );

        MvcResult quoteResult = mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID quotationId = UUID.fromString(objectMapper.readTree(quoteResult.getResponse().getContentAsString()).get("id").asText());

        // Buyer rejects quotation
        mockMvc.perform(post("/api/v1/rfqs/" + rfqId + "/quotations/" + quotationId + "/reject")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\": \"Price outside target budget\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("REJECTED"));

        Rfq rejectedRfq = rfqRepository.findById(rfqId).orElseThrow();
        assertThat(rejectedRfq.getStatus()).isEqualTo(RfqStatus.REJECTED);
    }

    @Test
    @DisplayName("17 & 18 & 19 & 20. Supplier response rate and response time calculations on quotation submission")
    public void testSupplierPerformanceMetricsCalculation() throws Exception {
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("500.00"),
                "kg",
                "Urgent requirement",
                14
        );

        MvcResult rfqResult = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID rfqId = UUID.fromString(objectMapper.readTree(rfqResult.getResponse().getContentAsString()).get("id").asText());

        // Initially: unrespondedRfqs should be 0 since RFQ was just created (within 24h grace window)
        SupplierPerformanceResponse perfInitial = supplierPerformanceService.getSupplierPerformance(supplierA.getId());
        assertThat(perfInitial.respondedRfqs()).isEqualTo(0);

        // Supplier submits quotation
        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("98.50"),
                "USD",
                new BigDecimal("100"),
                7,
                LocalDate.now().plusDays(20),
                "ISO Tank",
                "Best export price"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isCreated());

        // Now: respondedRfqs should be 1, response rate 100%
        SupplierPerformanceResponse perfAfter = supplierPerformanceService.getSupplierPerformance(supplierA.getId());
        assertThat(perfAfter.respondedRfqs()).isEqualTo(1);
        assertThat(perfAfter.responseRate()).isEqualTo(100);
        assertThat(perfAfter.formattedResponseTime()).isNotBlank();
    }

    @Test
    @DisplayName("21 & 22. Cancelled RFQ rejects quotations and is excluded from performance response rate")
    public void testCancelledRfqWorkflow() throws Exception {
        CreateRfqRequest request = new CreateRfqRequest(
                null,
                activeMasterProduct.getId(),
                offeringA.getId(),
                supplierA.getId(),
                null,
                new BigDecimal("200.00"),
                "kg",
                "To be cancelled",
                7
        );

        MvcResult rfqResult = mockMvc.perform(post("/api/v1/rfqs")
                        .header("Authorization", "Bearer " + buyerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        UUID rfqId = UUID.fromString(objectMapper.readTree(rfqResult.getResponse().getContentAsString()).get("id").asText());

        // Buyer cancels RFQ
        mockMvc.perform(post("/api/v1/rfqs/" + rfqId + "/cancel?reason=NoLongerNeeded")
                        .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Supplier tries to submit quotation to cancelled RFQ -> 409 Conflict
        CreateQuotationRequest quoteReq = new CreateQuotationRequest(
                new BigDecimal("115.00"),
                "INR",
                new BigDecimal("50"),
                5,
                LocalDate.now().plusDays(10),
                "Drums",
                "Quote"
        );

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                        .header("Authorization", "Bearer " + supplierAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isConflict());

        // Performance excludes cancelled RFQ
        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplierA.getId());
        assertThat(perf.respondedRfqs()).isEqualTo(0);
        assertThat(perf.unrespondedRfqs()).isEqualTo(0);
    }
}
