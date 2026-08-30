package com.synthora.admin.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.Shipment;
import com.synthora.order.ShipmentRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.rfq.quotation.Quotation;
import com.synthora.rfq.quotation.QuotationRepository;
import com.synthora.security.JwtService;
import com.synthora.seller.SupplierVerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AdminAnalyticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private ShipmentRepository shipmentRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    private User adminUser;
    private User buyerUser;
    private User supplierUser;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // 1. Create Admin
        adminUser = new User();
        adminUser.setName("Platform Admin");
        adminUser.setEmail("admin.analytics@synthora.com");
        adminUser.setPasswordHash("hash123");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setEmailVerifiedAt(Instant.now());
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        // 2. Create Buyer
        buyerUser = new User();
        buyerUser.setName("Test Buyer");
        buyerUser.setEmail("buyer.analytics@synthora.com");
        buyerUser.setPasswordHash("hash123");
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser.setEmailVerifiedAt(Instant.now());
        buyerUser = userRepository.save(buyerUser);
        buyerToken = jwtService.generateToken(buyerUser);

        // 3. Create Supplier
        supplierUser = new User();
        supplierUser.setName("Test Supplier");
        supplierUser.setEmail("supplier.analytics@synthora.com");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setEmailVerifiedAt(Instant.now());
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        supplier = new Supplier();
        supplier.setUser(supplierUser);
        supplier.setName("Acme Chemical Labs");
        supplier.setVerificationStatus(SupplierVerificationStatus.VERIFIED);
        supplier.setCreatedAt(LocalDateTime.now());
        supplier = supplierRepository.save(supplier);
    }

    @Test
    @DisplayName("Security: Unauthenticated request to analytics gets 401")
    void testUnauthenticatedAccessDenied() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/overview"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security: Buyer gets 403 Forbidden")
    void testBuyerAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/overview")
                .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Supplier gets 403 Forbidden")
    void testSupplierAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/overview")
                .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Analytics: Admin receives 200 OK and accurate aggregate metrics")
    void testAdminReceivesAccurateAnalytics() throws Exception {
        // Seed RFQ
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("500"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.QUOTED);
        rfq.setCreatedAt(LocalDateTime.now());
        rfq = rfqRepository.save(rfq);

        // Seed Quotation
        Quotation quote = new Quotation();
        quote.setRfq(rfq);
        quote.setQuotationVersion(1);
        quote.setUnitPrice(new BigDecimal("12.50"));
        quote.setCurrency("USD");
        quote.setValidityDate(LocalDate.now().plusDays(15));
        quote.setCreatedAt(LocalDateTime.now());
        quote = quotationRepository.save(quote);

        // Seed Purchase Order
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-TEST01");
        po.setRfqId(rfq.getId());
        po.setQuotationId(quote.getId());
        po.setBuyerId(buyerUser.getId());
        po.setSupplierId(supplier.getId());
        po.setQuantity(new BigDecimal("500"));
        po.setUnit("kg");
        po.setUnitPrice(new BigDecimal("12.50"));
        po.setTotalAmount(new BigDecimal("6250.00"));
        po.setCurrency("USD");
        po.setStatus(OrderStatus.PLACED);
        po.setShippingAddress("Port of Antwerp, Berth 4");
        po.setBillingContact("finance@buyer.com");
        po.setPlacedAt(LocalDateTime.now());
        po = purchaseOrderRepository.save(po);

        // Seed Shipment
        Shipment shipment = new Shipment();
        shipment.setPurchaseOrder(po);
        shipment.setCarrier("DHL Express Global");
        shipment.setTrackingNumber("DHL-987654321");
        shipment.setEstimatedDeliveryDate(LocalDate.now().plusDays(5));
        shipment.setShippedAt(LocalDateTime.now());
        shipment = shipmentRepository.save(shipment);

        mockMvc.perform(get("/api/v1/admin/analytics/overview")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period", is("30d")))
                .andExpect(jsonPath("$.users.totalUsers", is(3)))
                .andExpect(jsonPath("$.users.totalBuyers", is(1)))
                .andExpect(jsonPath("$.users.totalSuppliers", is(1)))
                .andExpect(jsonPath("$.suppliers.totalSuppliers", is(1)))
                .andExpect(jsonPath("$.suppliers.verifiedSuppliers", is(1)))
                .andExpect(jsonPath("$.marketplace.totalRfqs", is(1)))
                .andExpect(jsonPath("$.marketplace.totalQuotations", is(1)))
                .andExpect(jsonPath("$.orders.totalOrders", is(1)))
                .andExpect(jsonPath("$.orders.placedOrders", is(1)))
                .andExpect(jsonPath("$.commercial.totalGmv", is(6250.00)))
                .andExpect(jsonPath("$.commercial.averageOrderValue", is(6250.00)))
                .andExpect(jsonPath("$.shipments.totalShipments", is(1)))
                .andExpect(jsonPath("$.shipments.activeShipments", is(1)))
                .andExpect(jsonPath("$.funnel.stages", hasSize(5)))
                .andExpect(jsonPath("$.trends.userRegistrations", notNullValue()));
    }

    @Test
    @DisplayName("Analytics: Date filtering with 7d and custom range")
    void testDateRangeFiltering() throws Exception {
        mockMvc.perform(get("/api/v1/admin/analytics/overview?period=7d")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period", is("7d")))
                .andExpect(jsonPath("$.trends.userRegistrations", hasSize(7)));

        mockMvc.perform(get("/api/v1/admin/analytics/overview?period=custom&from=2026-08-01&to=2026-08-10")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period", is("custom")))
                .andExpect(jsonPath("$.startDate", is("2026-08-01")))
                .andExpect(jsonPath("$.endDate", is("2026-08-10")));
    }

    @Test
    @DisplayName("Analytics: Handles empty database gracefully with 0 values")
    void testEmptyDatabaseGracefulHandling() throws Exception {
        // Clear all except admin
        jdbcTemplate.execute("DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM suppliers; DELETE FROM users WHERE role != 'ADMIN';");

        mockMvc.perform(get("/api/v1/admin/analytics/overview")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.totalBuyers", is(0)))
                .andExpect(jsonPath("$.suppliers.totalSuppliers", is(0)))
                .andExpect(jsonPath("$.marketplace.totalRfqs", is(0)))
                .andExpect(jsonPath("$.orders.totalOrders", is(0)))
                .andExpect(jsonPath("$.commercial.totalGmv", is(0.00)))
                .andExpect(jsonPath("$.commercial.rfqToQuotationConversionRate", is(0.0)))
                .andExpect(jsonPath("$.funnel.overallConversionRate", is(0.0)));
    }
}
