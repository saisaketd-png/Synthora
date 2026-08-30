package com.kemkendra.seller;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductCategory;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.product.dto.SupplierPerformanceResponse;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
import com.kemkendra.rfq.RfqStatus;
import com.kemkendra.rfq.quotation.Quotation;
import com.kemkendra.rfq.quotation.QuotationRepository;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SupplierPerformanceSecurityTest {

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
    private SupplierPerformanceService supplierPerformanceService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User supplierUser;
    private Supplier supplier;
    private User buyerUser;
    private Product product;
    private String supplierToken;
    private String buyerToken;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM quotations");
        jdbcTemplate.execute("DELETE FROM rfqs");
        jdbcTemplate.execute("DELETE FROM supplier_offerings");
        jdbcTemplate.execute("DELETE FROM products");
        jdbcTemplate.execute("DELETE FROM suppliers");
        jdbcTemplate.execute("DELETE FROM users WHERE email IN ('perf_supplier@example.com', 'perf_buyer@example.com')");

        supplierUser = new User();
        supplierUser.setName("Apex Supplier User");
        supplierUser.setEmail("perf_supplier@example.com");
        supplierUser.setPasswordHash("hashed_secret");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Apex Specialty Chemicals");
        supplier.setCountryCode("IN");
        supplier.setCountryName("India");
        supplier.setVerified(true);
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        buyerUser = new User();
        buyerUser.setName("Apex Buyer User");
        buyerUser.setEmail("perf_buyer@example.com");
        buyerUser.setPasswordHash("hashed_secret");
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);

        product = new Product();
        product.setName("Paracetamol Grade A");
        product.setCategory(ProductCategory.API);
        product.setCasNumber("103-90-2");
        product.setPrice(new BigDecimal("12.50"));
        product.setStock(1000);
        product.setProductCode("PRD-PERF-101");
        product.setSeller(supplierUser);
        product = productRepository.save(product);

        supplierToken = jwtService.generateToken(supplierUser);
        buyerToken = jwtService.generateToken(buyerUser);
    }

    @Test
    void testSupplierWithNoRfqs_ReturnsNullMetricsGracefully() {
        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplier.getId());

        assertThat(perf.responseRate()).isNull();
        assertThat(perf.averageResponseTimeSeconds()).isNull();
        assertThat(perf.formattedResponseTime()).isNull();
        assertThat(perf.totalRfqsReceived()).isEqualTo(0);
        assertThat(perf.eligibleRfqs()).isEqualTo(0);
        assertThat(perf.respondedRfqs()).isEqualTo(0);
    }

    @Test
    void testSupplierWithOneRespondedRfq_Calculates100PercentAndAccurateDuration() {
        LocalDateTime rfqTime = LocalDateTime.now().minusHours(4);
        LocalDateTime quoteTime = rfqTime.plusHours(2).plusMinutes(15);

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.QUOTED);
        rfq.setCreatedAt(rfqTime);
        rfq.setUpdatedAt(quoteTime);
        rfq = rfqRepository.save(rfq);

        Quotation quotation = new Quotation();
        quotation.setRfq(rfq);
        quotation.setQuotationVersion(1);
        quotation.setUnitPrice(new BigDecimal("12.50"));
        quotation.setCurrency("USD");
        quotation.setValidityDate(LocalDate.now().plusDays(30));
        quotation.setActorType("SUPPLIER");
        quotation.setCreatedAt(quoteTime);
        quotationRepository.save(quotation);

        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplier.getId());

        assertThat(perf.responseRate()).isEqualTo(100);
        assertThat(perf.eligibleRfqs()).isEqualTo(1);
        assertThat(perf.respondedRfqs()).isEqualTo(1);
        assertThat(perf.unrespondedRfqs()).isEqualTo(0);
        assertThat(perf.averageResponseTimeSeconds()).isEqualTo(8100L); // 2h 15m = 8100s
        assertThat(perf.formattedResponseTime()).isEqualTo("2h 15m");
    }

    @Test
    void testSupplierWithExpiredUnansweredRfq_Calculates0Percent() {
        LocalDateTime rfqTime = LocalDateTime.now().minusDays(5); // Past 72h window

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(new BigDecimal("500"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.PENDING);
        rfq.setCreatedAt(rfqTime);
        rfq.setUpdatedAt(rfqTime);
        rfqRepository.save(rfq);

        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplier.getId());

        assertThat(perf.responseRate()).isEqualTo(0);
        assertThat(perf.eligibleRfqs()).isEqualTo(1);
        assertThat(perf.respondedRfqs()).isEqualTo(0);
        assertThat(perf.unrespondedRfqs()).isEqualTo(1);
        assertThat(perf.averageResponseTimeSeconds()).isNull();
        assertThat(perf.formattedResponseTime()).isNull();
    }

    @Test
    void testSupplierWithMixedHistory_CalculatesAccurateRatio() {
        // RFQ 1: Responded in 1 hour
        LocalDateTime rfq1Time = LocalDateTime.now().minusDays(4);
        LocalDateTime quote1Time = rfq1Time.plusHours(1);

        Rfq rfq1 = new Rfq();
        rfq1.setBuyerId(buyerUser.getId());
        rfq1.setSupplierId(supplier.getId());
        rfq1.setProductId(product.getId());
        rfq1.setQuantity(new BigDecimal("100"));
        rfq1.setUnit("kg");
        rfq1.setStatus(RfqStatus.QUOTED);
        rfq1.setCreatedAt(rfq1Time);
        rfq1.setUpdatedAt(quote1Time);
        rfq1 = rfqRepository.save(rfq1);

        Quotation q1 = new Quotation();
        q1.setRfq(rfq1);
        q1.setQuotationVersion(1);
        q1.setUnitPrice(new BigDecimal("10.00"));
        q1.setCurrency("USD");
        q1.setValidityDate(LocalDate.now().plusDays(30));
        q1.setActorType("SUPPLIER");
        q1.setCreatedAt(quote1Time);
        quotationRepository.save(q1);

        // RFQ 2: Expired unanswered
        LocalDateTime rfq2Time = LocalDateTime.now().minusDays(5);
        Rfq rfq2 = new Rfq();
        rfq2.setBuyerId(buyerUser.getId());
        rfq2.setSupplierId(supplier.getId());
        rfq2.setProductId(product.getId());
        rfq2.setQuantity(new BigDecimal("200"));
        rfq2.setUnit("kg");
        rfq2.setStatus(RfqStatus.PENDING);
        rfq2.setCreatedAt(rfq2Time);
        rfq2.setUpdatedAt(rfq2Time);
        rfqRepository.save(rfq2);

        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplier.getId());

        // 1 responded / 2 eligible = 50%
        assertThat(perf.responseRate()).isEqualTo(50);
        assertThat(perf.eligibleRfqs()).isEqualTo(2);
        assertThat(perf.respondedRfqs()).isEqualTo(1);
        assertThat(perf.unrespondedRfqs()).isEqualTo(1);
        assertThat(perf.averageResponseTimeSeconds()).isEqualTo(3600L); // 1h
        assertThat(perf.formattedResponseTime()).isEqualTo("1h");
    }

    @Test
    void testPendingRfqWithinWindow_DoesNotPenalizeSupplier() {
        // RFQ received 2 hours ago (within 72h window) without response yet
        LocalDateTime rfqTime = LocalDateTime.now().minusHours(2);

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.PENDING);
        rfq.setCreatedAt(rfqTime);
        rfq.setUpdatedAt(rfqTime);
        rfqRepository.save(rfq);

        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplier.getId());

        // Pending RFQ is not in denominator -> eligible = 0, rate = null (graceful)
        assertThat(perf.totalRfqsReceived()).isEqualTo(1);
        assertThat(perf.pendingRfqs()).isEqualTo(1);
        assertThat(perf.eligibleRfqs()).isEqualTo(0);
        assertThat(perf.responseRate()).isNull();
    }

    @Test
    void testCancelledRfq_IsExcludedFromMetrics() {
        LocalDateTime rfqTime = LocalDateTime.now().minusDays(5);

        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(new BigDecimal("100"));
        rfq.setUnit("kg");
        rfq.setStatus(RfqStatus.CANCELLED);
        rfq.setCreatedAt(rfqTime);
        rfq.setUpdatedAt(rfqTime);
        rfqRepository.save(rfq);

        SupplierPerformanceResponse perf = supplierPerformanceService.getSupplierPerformance(supplier.getId());

        assertThat(perf.eligibleRfqs()).isEqualTo(0);
        assertThat(perf.responseRate()).isNull();
    }

    @Test
    void testDurationFormattingRules() {
        assertThat(SupplierPerformanceService.formatDuration(null)).isNull();
        assertThat(SupplierPerformanceService.formatDuration(30L)).isEqualTo("1m");
        assertThat(SupplierPerformanceService.formatDuration(2700L)).isEqualTo("45m");
        assertThat(SupplierPerformanceService.formatDuration(15480L)).isEqualTo("4h 18m");
        assertThat(SupplierPerformanceService.formatDuration(7200L)).isEqualTo("2h");
        assertThat(SupplierPerformanceService.formatDuration(100800L)).isEqualTo("1d 4h");
    }

    @Test
    void testPublicAndSupplierEndpoints() throws Exception {
        // 1. Public endpoint allows anonymous and buyer inspection
        mockMvc.perform(get("/api/v1/suppliers/" + supplier.getId() + "/performance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplierId").value(supplier.getId()))
                .andExpect(jsonPath("$.totalRfqsReceived").value(0));

        // 2. Supplier can check their own performance
        mockMvc.perform(get("/api/v1/supplier/performance")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.supplierId").value(supplier.getId()));

        // 3. Unauthenticated call to /api/v1/supplier/performance is rejected
        mockMvc.perform(get("/api/v1/supplier/performance"))
                .andExpect(status().isUnauthorized());
    }
}
