package com.synthora.rfq;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BuyerQuotationDecisionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private com.synthora.order.PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private com.synthora.product.ProductRepository productRepository;

    private User buyer1;
    private String buyer1Token;

    private User buyer2;
    private String buyer2Token;

    private User supplierUser;
    private Supplier supplier;
    private String supplierToken;

    @BeforeEach
    public void setup() {
        purchaseOrderRepository.deleteAll();
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();
        userRepository.deleteAll();

        buyer1 = new User();
        buyer1.setEmail("buyer1@synthora.com");
        buyer1.setName("Buyer One");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(UserRole.USER);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        buyer2 = new User();
        buyer2.setEmail("buyer2@synthora.com");
        buyer2.setName("Buyer Two");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(UserRole.USER);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        supplierUser = new User();
        supplierUser.setEmail("seller@synthora.com");
        supplierUser.setName("Seller User");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        supplier = new Supplier();
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);
    }

    private Rfq createRfq(User buyer, RfqStatus status) {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setProductId(UUID.randomUUID());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("1000"));
        rfq.setUnit("kg");
        rfq.setStatus(status);
        return rfqRepository.save(rfq);
    }

    private Quotation createQuotation(Rfq rfq, int version, BigDecimal price) {
        Quotation q = new Quotation();
        q.setRfq(rfq);
        q.setQuotationVersion(version);
        q.setUnitPrice(price);
        q.setCurrency("USD");
        q.setValidityDate(LocalDate.of(2026, 12, 31));
        return quotationRepository.save(q);
    }

    @Test
    public void testBuyerAcceptsLatestQuotationSuccess() throws Exception {
        Rfq rfq = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q1 = createQuotation(rfq, 1, new BigDecimal("100.0000"));
        Quotation q2 = createQuotation(rfq, 2, new BigDecimal("95.0000"));

        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q2.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decisionNotes\": \"Approved best price\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rfqId").value(rfq.getId().toString()))
                .andExpect(jsonPath("$.quotationId").value(q2.getId().toString()))
                .andExpect(jsonPath("$.quotationVersion").value(2))
                .andExpect(jsonPath("$.rfqStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.decision").value("ACCEPTED"))
                .andExpect(jsonPath("$.decisionTimestamp").isNotEmpty());

        Rfq updated = rfqRepository.findById(rfq.getId()).orElseThrow();
        assertEquals(RfqStatus.ACCEPTED, updated.getStatus());
        assertEquals(q2.getId(), updated.getAcceptedQuotationId());
    }

    @Test
    public void testBuyerRejectsLatestQuotationSuccess() throws Exception {
        Rfq rfq = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q1 = createQuotation(rfq, 1, new BigDecimal("100.0000"));

        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q1.getId() + "/reject")
                .header("Authorization", "Bearer " + buyer1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rejectionReason\": \"Price too high\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rfqId").value(rfq.getId().toString()))
                .andExpect(jsonPath("$.quotationId").value(q1.getId().toString()))
                .andExpect(jsonPath("$.quotationVersion").value(1))
                .andExpect(jsonPath("$.rfqStatus").value("REJECTED"))
                .andExpect(jsonPath("$.decision").value("REJECTED"));

        Rfq updated = rfqRepository.findById(rfq.getId()).orElseThrow();
        assertEquals(RfqStatus.REJECTED, updated.getStatus());
    }

    @Test
    public void testBuyerCannotAcceptOlderQuotationVersion() throws Exception {
        Rfq rfq = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q1 = createQuotation(rfq, 1, new BigDecimal("100.0000"));
        Quotation q2 = createQuotation(rfq, 2, new BigDecimal("95.0000"));

        // Attempting to accept v1 when v2 exists -> 409 Conflict
        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q1.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isConflict());

        // Attempting to reject v1 when v2 exists -> 409 Conflict
        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q1.getId() + "/reject")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isConflict());
    }

    @Test
    public void testBuyerCannotDecideOnOtherBuyersRfq() throws Exception {
        Rfq rfq = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q1 = createQuotation(rfq, 1, new BigDecimal("100.0000"));

        // Buyer 2 calls decision on Buyer 1's RFQ -> 404 Not Found
        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q1.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testBuyerCannotDecideOnForeignQuotation() throws Exception {
        Rfq rfq1 = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q1 = createQuotation(rfq1, 1, new BigDecimal("100.0000"));

        Rfq rfq2 = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q2 = createQuotation(rfq2, 1, new BigDecimal("200.0000"));

        // Targeting RFQ1 with Quotation2 ID -> 404 Not Found
        mockMvc.perform(post("/api/v1/rfqs/" + rfq1.getId() + "/quotations/" + q2.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testNonexistentRfqOrQuotationYields404() throws Exception {
        Rfq rfq = createRfq(buyer1, RfqStatus.QUOTED);

        mockMvc.perform(post("/api/v1/rfqs/" + UUID.randomUUID() + "/quotations/" + UUID.randomUUID() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + UUID.randomUUID() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testDecisionsOnTerminalRfqsYield409() throws Exception {
        // ACCEPTED RFQ
        Rfq rfqAccepted = createRfq(buyer1, RfqStatus.ACCEPTED);
        Quotation qA = createQuotation(rfqAccepted, 1, new BigDecimal("100"));
        mockMvc.perform(post("/api/v1/rfqs/" + rfqAccepted.getId() + "/quotations/" + qA.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isConflict());

        // REJECTED RFQ
        Rfq rfqRejected = createRfq(buyer1, RfqStatus.REJECTED);
        Quotation qR = createQuotation(rfqRejected, 1, new BigDecimal("100"));
        mockMvc.perform(post("/api/v1/rfqs/" + rfqRejected.getId() + "/quotations/" + qR.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isConflict());

        // CLOSED RFQ
        Rfq rfqClosed = createRfq(buyer1, RfqStatus.CLOSED);
        Quotation qC = createQuotation(rfqClosed, 1, new BigDecimal("100"));
        mockMvc.perform(post("/api/v1/rfqs/" + rfqClosed.getId() + "/quotations/" + qC.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isConflict());

        // CANCELLED RFQ
        Rfq rfqCancelled = createRfq(buyer1, RfqStatus.CANCELLED);
        Quotation qCn = createQuotation(rfqCancelled, 1, new BigDecimal("100"));
        mockMvc.perform(post("/api/v1/rfqs/" + rfqCancelled.getId() + "/quotations/" + qCn.getId() + "/accept")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isConflict());
    }

    @Test
    public void testSupplierCannotSubmitQuoteToAcceptedOrRejectedRfq() throws Exception {
        Rfq rfqAccepted = createRfq(buyer1, RfqStatus.ACCEPTED);
        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqAccepted.getId() + "/quotations")
                .header("Authorization", "Bearer " + supplierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"unitPrice\": 100.0, \"currency\": \"USD\", \"validityDate\": \"2026-12-31\"}"))
                .andExpect(status().isConflict());

        Rfq rfqRejected = createRfq(buyer1, RfqStatus.REJECTED);
        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqRejected.getId() + "/quotations")
                .header("Authorization", "Bearer " + supplierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"unitPrice\": 100.0, \"currency\": \"USD\", \"validityDate\": \"2026-12-31\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    public void testUnauthenticatedAndSupplierCannotExecuteDecision() throws Exception {
        Rfq rfq = createRfq(buyer1, RfqStatus.QUOTED);
        Quotation q = createQuotation(rfq, 1, new BigDecimal("100"));

        // Unauthenticated -> 401/403
        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q.getId() + "/accept"))
                .andExpect(status().isForbidden());

        // Supplier JWT -> 404 (because supplier is not the buyer owner of this RFQ)
        mockMvc.perform(post("/api/v1/rfqs/" + rfq.getId() + "/quotations/" + q.getId() + "/accept")
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isNotFound());
    }
}
