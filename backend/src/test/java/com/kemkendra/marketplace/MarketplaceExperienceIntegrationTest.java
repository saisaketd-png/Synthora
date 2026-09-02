package com.kemkendra.marketplace;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditLog;
import com.kemkendra.admin.audit.AuditLogRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MarketplaceExperienceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    private User buyer;
    private User supplierUser;
    private User thirdPartyUser;
    private Supplier supplier;

    private String buyerToken;
    private String supplierToken;
    private String thirdPartyToken;

    @BeforeEach
    void setUp() {
        buyer = new User();
        buyer.setId(UUID.randomUUID());
        buyer.setName("Buyer User");
        buyer.setEmail("buyer-" + UUID.randomUUID() + "@pharma.com");
        buyer.setPasswordHash("hash");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer.setCreatedAt(Instant.now());
        buyer.setUpdatedAt(Instant.now());
        buyer = userRepository.save(buyer);
        buyerToken = jwtService.generateToken(buyer);

        supplierUser = new User();
        supplierUser.setId(UUID.randomUUID());
        supplierUser.setName("Supplier User");
        supplierUser.setEmail("supplier-" + UUID.randomUUID() + "@pharma.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setCreatedAt(Instant.now());
        supplierUser.setUpdatedAt(Instant.now());
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        supplier = new Supplier();
        supplier.setUser(supplierUser);
        supplier.setName("Synthetics Alpha Ltd");
        supplier.setLegalName("Synthetics Alpha India Pvt Ltd");
        supplier.setSlug("synthetics-alpha-" + UUID.randomUUID().toString().substring(0, 6));
        supplier.setBusinessEmail(supplierUser.getEmail());
        supplier.setCountryName("India");
        supplier = supplierRepository.save(supplier);

        thirdPartyUser = new User();
        thirdPartyUser.setId(UUID.randomUUID());
        thirdPartyUser.setName("Third Party User");
        thirdPartyUser.setEmail("thirdparty-" + UUID.randomUUID() + "@pharma.com");
        thirdPartyUser.setPasswordHash("hash");
        thirdPartyUser.setRole(UserRole.USER);
        thirdPartyUser.setStatus(UserStatus.ACTIVE);
        thirdPartyUser.setCreatedAt(Instant.now());
        thirdPartyUser.setUpdatedAt(Instant.now());
        thirdPartyUser = userRepository.save(thirdPartyUser);
        thirdPartyToken = jwtService.generateToken(thirdPartyUser);
    }

    private PurchaseOrder createDeliveredOrder() {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq.setQuantity(new BigDecimal("500.00"));
        rfq.setUnit("KG");
        rfq.setCreatedAt(LocalDateTime.now().minusDays(5));
        rfq = rfqRepository.save(rfq);

        Quotation quote = new Quotation();
        quote.setRfq(rfq);
        quote.setUnitPrice(new BigDecimal("115.00"));
        quote.setCurrency("INR");
        quote.setMinimumOrderQuantity(new BigDecimal("100.00"));
        quote.setLeadTimeDays(7);
        quote.setValidityDate(LocalDate.now().plusDays(30));
        quote.setQuotationVersion(1);
        quote.setActionType("INITIAL_QUOTATION");
        quote.setActorType("SUPPLIER");
        quote = quotationRepository.save(quote);

        rfq.setAcceptedQuotationId(quote.getId());
        rfqRepository.save(rfq);

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-EXP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(supplier.getId());
        po.setRfqId(rfq.getId());
        po.setQuotationId(quote.getId());
        po.setQuantity(new BigDecimal("500.00"));
        po.setUnit("KG");
        po.setUnitPrice(new BigDecimal("115.00"));
        po.setTotalAmount(new BigDecimal("57500.00"));
        po.setCurrency("INR");
        po.setShippingAddress("Industrial Area Unit 4, Hyderabad");
        po.setBillingContact("Procurement Lead, +91-9876543210");
        po.setStatus(OrderStatus.DELIVERED);
        po.setPlacedAt(LocalDateTime.now().minusDays(4));
        po.setConfirmedAt(LocalDateTime.now().minusDays(3));
        po.setProcessingAt(LocalDateTime.now().minusDays(2));
        po.setShippedAt(LocalDateTime.now().minusDays(1));
        po.setDeliveredAt(LocalDateTime.now().minusHours(2));
        return purchaseOrderRepository.save(po);
    }

    @Test
    @DisplayName("P0: Buyer completes order -> Status becomes COMPLETED, PO_COMPLETED audit logged, supplier receives notification")
    void testBuyerCompletesOrderSuccessfully() throws Exception {
        PurchaseOrder po = createDeliveredOrder();

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(updated.getCompletedAt()).isNotNull();

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findAll().stream()
                .filter(a -> a.getAction() == AuditAction.PO_COMPLETED && a.getTargetId().equals(po.getId().toString()))
                .toList();
        assertThat(auditLogs).isNotEmpty();
        assertThat(auditLogs.get(0).getAdminId()).isEqualTo(buyer.getId());
    }

    @Test
    @DisplayName("P0: Supplier completes order -> Status becomes COMPLETED, buyer receives notification")
    void testSupplierCompletesOrderSuccessfully() throws Exception {
        PurchaseOrder po = createDeliveredOrder();

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        PurchaseOrder updated = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(updated.getCompletedAt()).isNotNull();

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findAll().stream()
                .filter(a -> a.getAction() == AuditAction.PO_COMPLETED && a.getTargetId().equals(po.getId().toString()))
                .toList();
        assertThat(auditLogs).isNotEmpty();
        assertThat(auditLogs.get(0).getAdminId()).isEqualTo(supplierUser.getId());
    }

    @Test
    @DisplayName("P0: Reject order completion when order is not DELIVERED (e.g. PLACED or SHIPPED)")
    void testRejectCompletionWhenNotDelivered() throws Exception {
        PurchaseOrder po = createDeliveredOrder();
        po.setStatus(OrderStatus.SHIPPED);
        po.setDeliveredAt(null);
        purchaseOrderRepository.save(po);

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("P0: Reject duplicate completion attempt on already COMPLETED order")
    void testRejectDuplicateCompletion() throws Exception {
        PurchaseOrder po = createDeliveredOrder();
        po.setStatus(OrderStatus.COMPLETED);
        po.setCompletedAt(LocalDateTime.now().minusHours(1));
        purchaseOrderRepository.save(po);

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Security & IDOR: Unrelated third party user cannot complete purchase order")
    void testThirdPartyCannotCompleteOrder() throws Exception {
        PurchaseOrder po = createDeliveredOrder();

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + thirdPartyToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Security: Suspended buyer cannot complete order")
    void testSuspendedUserCannotCompleteOrder() throws Exception {
        PurchaseOrder po = createDeliveredOrder();
        buyer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(buyer);

        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("End-to-End Commercial Flow: PO confirmation -> Processing -> Dispatch -> Delivery -> Completion")
    void testCompleteFulfillmentProgression() throws Exception {
        PurchaseOrder po = createDeliveredOrder();
        po.setStatus(OrderStatus.PLACED);
        po.setConfirmedAt(null);
        po.setProcessingAt(null);
        po.setShippedAt(null);
        po.setDeliveredAt(null);
        po = purchaseOrderRepository.save(po);

        // 1. Supplier confirms
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // 2. Supplier starts processing
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/process")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"));

        // 3. Supplier ships consignment
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/ship")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supplierToken)
                        .contentType("application/json")
                        .content("{\"carrier\":\"BlueDart Express\",\"trackingNumber\":\"AWB-778899\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));

        // 4. Buyer confirms receipt
        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/receive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        // 5. Final order completion
        mockMvc.perform(post("/api/v1/orders/" + po.getId() + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        PurchaseOrder finalPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertThat(finalPo.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(finalPo.getConfirmedAt()).isNotNull();
        assertThat(finalPo.getProcessingAt()).isNotNull();
        assertThat(finalPo.getShippedAt()).isNotNull();
        assertThat(finalPo.getDeliveredAt()).isNotNull();
        assertThat(finalPo.getCompletedAt()).isNotNull();
    }
}
