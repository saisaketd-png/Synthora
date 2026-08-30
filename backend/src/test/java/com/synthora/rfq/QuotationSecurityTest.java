package com.synthora.rfq;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.ShipmentRepository;
import com.synthora.product.Product;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.security.JwtService;
import com.synthora.seller.SellerProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class QuotationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");
    }

    @Test
    public void testSupplierEndpoints() throws Exception {
        User user = new User();
        user.setEmail("unregistered_seller@synthora.com");
        user.setName("Unregistered Seller");
        user.setPasswordHash("hash123");
        user.setRole(UserRole.SUPPLIER);
        user.setStatus(UserStatus.ACTIVE);
        user = userRepository.save(user);
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
        User buyer1 = new User();
        buyer1.setEmail("buyer1@synthora.com");
        buyer1.setName("Buyer One");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        String buyer1Token = jwtService.generateToken(buyer1);

        // 2. Create Buyer 2
        User buyer2 = new User();
        buyer2.setEmail("buyer2@synthora.com");
        buyer2.setName("Buyer Two");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        String buyer2Token = jwtService.generateToken(buyer2);

        // 3. Create RFQ for Buyer 1
        Rfq rfq1 = new Rfq();
        rfq1.setBuyerId(buyer1.getId());
        rfq1.setProductId(UUID.randomUUID());
        rfq1.setSupplierId(100L);
        rfq1.setQuantity(new BigDecimal("500"));
        rfq1.setUnit("kg");
        rfq1 = rfqRepository.save(rfq1);

        // 4. Create RFQ with no quotations for Buyer 1
        Rfq rfqEmpty = new Rfq();
        rfqEmpty.setBuyerId(buyer1.getId());
        rfqEmpty.setProductId(UUID.randomUUID());
        rfqEmpty.setSupplierId(100L);
        rfqEmpty.setQuantity(new BigDecimal("200"));
        rfqEmpty.setUnit("kg");
        rfqEmpty = rfqRepository.save(rfqEmpty);

        // 5. Add quotations to RFQ 1 (v1 and v2)
        Quotation q1 = new Quotation();
        q1.setRfq(rfq1);
        q1.setQuotationVersion(1);
        q1.setUnitPrice(new BigDecimal("150.0000"));
        q1.setCurrency("USD");
        q1.setValidityDate(LocalDate.of(2026, 12, 31));
        quotationRepository.save(q1);

        Quotation q2 = new Quotation();
        q2.setRfq(rfq1);
        q2.setQuotationVersion(2);
        q2.setUnitPrice(new BigDecimal("140.0000"));
        q2.setCurrency("USD");
        q2.setValidityDate(LocalDate.of(2026, 12, 31));
        quotationRepository.save(q2);

        // Test 1: Unauthenticated request -> 401
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId() + "/quotations"))
                .andExpect(status().isUnauthorized());

        // Test 2: Buyer 1 owns RFQ 1 -> 200 with versions ordered 2, 1
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId() + "/quotations")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].quotationVersion").value(2))
                .andExpect(jsonPath("$[1].quotationVersion").value(1));

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
                .andExpect(jsonPath("$.length()").value(0));
    }
}
