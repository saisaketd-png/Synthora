package com.synthora.rfq;

import com.synthora.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class QuotationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private com.synthora.identity.UserRepository userRepository;

    @Autowired
    private com.synthora.rfq.RfqRepository rfqRepository;

    @Autowired
    private com.synthora.rfq.quotation.QuotationRepository quotationRepository;

    @Autowired
    private com.synthora.product.SupplierRepository supplierRepository;

    @Autowired
    private com.synthora.order.PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private com.synthora.order.ShipmentRepository shipmentRepository;

    @Autowired
    private com.synthora.product.ProductRepository productRepository;

    @Autowired
    private com.synthora.seller.SellerProfileRepository sellerProfileRepository;

    @org.junit.jupiter.api.BeforeEach
    public void setup() {
        shipmentRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();
        sellerProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    public void testSupplierEndpoints() throws Exception {
        com.synthora.identity.User user = new com.synthora.identity.User();
        user.setEmail("unregistered_seller@synthora.com");
        user.setRole(com.synthora.identity.UserRole.SUPPLIER);
        String token = jwtService.generateToken(user);
        
        // GET 1
        mockMvc.perform(get("/api/v1/rfqs/supplier")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        // GET 2
        UUID rfqId = UUID.randomUUID();
        mockMvc.perform(get("/api/v1/rfqs/supplier/" + rfqId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        // POST
        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfqId + "/quotations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"unitPrice\": 10.0, \"currency\": \"USD\", \"validityDate\": \"2026-12-31\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testBuyerQuotationOwnershipAndOrdering() throws Exception {
        // 1. Create Buyer 1
        com.synthora.identity.User buyer1 = new com.synthora.identity.User();
        buyer1.setEmail("buyer1@synthora.com");
        buyer1.setName("Buyer One");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(com.synthora.identity.UserRole.USER);
        buyer1 = userRepository.save(buyer1);
        String buyer1Token = jwtService.generateToken(buyer1);

        // 2. Create Buyer 2
        com.synthora.identity.User buyer2 = new com.synthora.identity.User();
        buyer2.setEmail("buyer2@synthora.com");
        buyer2.setName("Buyer Two");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(com.synthora.identity.UserRole.USER);
        buyer2 = userRepository.save(buyer2);
        String buyer2Token = jwtService.generateToken(buyer2);

        // 3. Create RFQ for Buyer 1
        Rfq rfq1 = new Rfq();
        rfq1.setBuyerId(buyer1.getId());
        rfq1.setProductId(UUID.randomUUID());
        rfq1.setSupplierId(100L);
        rfq1.setQuantity(new java.math.BigDecimal("500"));
        rfq1.setUnit("kg");
        rfq1 = rfqRepository.save(rfq1);

        // 4. Create RFQ with no quotations for Buyer 1
        Rfq rfqEmpty = new Rfq();
        rfqEmpty.setBuyerId(buyer1.getId());
        rfqEmpty.setProductId(UUID.randomUUID());
        rfqEmpty.setSupplierId(100L);
        rfqEmpty.setQuantity(new java.math.BigDecimal("200"));
        rfqEmpty.setUnit("kg");
        rfqEmpty = rfqRepository.save(rfqEmpty);

        // 5. Add quotations to RFQ 1 (v1 and v2)
        com.synthora.rfq.quotation.Quotation q1 = new com.synthora.rfq.quotation.Quotation();
        q1.setRfq(rfq1);
        q1.setQuotationVersion(1);
        q1.setUnitPrice(new java.math.BigDecimal("150.0000"));
        q1.setCurrency("USD");
        q1.setValidityDate(java.time.LocalDate.of(2026, 12, 31));
        quotationRepository.save(q1);

        com.synthora.rfq.quotation.Quotation q2 = new com.synthora.rfq.quotation.Quotation();
        q2.setRfq(rfq1);
        q2.setQuotationVersion(2);
        q2.setUnitPrice(new java.math.BigDecimal("140.0000"));
        q2.setCurrency("USD");
        q2.setValidityDate(java.time.LocalDate.of(2026, 12, 31));
        quotationRepository.save(q2);

        // Test 1: Unauthenticated request -> 401/403
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId() + "/quotations"))
                .andExpect(status().isForbidden());

        // Test 2: Buyer 1 owns RFQ 1 -> 200 with versions ordered 2, 1
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId() + "/quotations")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].quotationVersion").value(2))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[1].quotationVersion").value(1));

        // Test 3: Buyer 2 requests Buyer 1's RFQ -> 404
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId() + "/quotations")
                .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isNotFound());

        // Test 4: Buyer 1 requests nonexistent RFQ -> 404
        mockMvc.perform(get("/api/v1/rfqs/" + UUID.randomUUID() + "/quotations")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isNotFound());

        // Test 5: Buyer 1 requests empty RFQ -> 200 with []
        mockMvc.perform(get("/api/v1/rfqs/" + rfqEmpty.getId() + "/quotations")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.length()").value(0));
    }
}
