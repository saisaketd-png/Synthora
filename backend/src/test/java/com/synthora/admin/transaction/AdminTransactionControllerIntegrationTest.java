package com.synthora.admin.transaction;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.admin.audit.AuditAction;
import com.synthora.admin.audit.AuditLogRepository;
import com.synthora.admin.audit.AuditTargetType;
import com.synthora.admin.transaction.dto.CancelAdminPurchaseOrderRequest;
import com.synthora.admin.transaction.dto.UpdateAdminRfqStatusRequest;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminTransactionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private com.synthora.product.MasterProductRepository masterProductRepository;

    @Autowired
    private com.synthora.product.SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User buyerUser;
    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private Rfq rfq;
    private PurchaseOrder po;

    private String adminToken;
    private String buyerToken;
    private String supplierToken;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        adminUser = new User();
        adminUser.setName("Admin Transactions");
        adminUser.setEmail("admin.tx.api@synthora.com");
        adminUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        buyerUser = new User();
        buyerUser.setName("Buyer John");
        buyerUser.setEmail("buyer.john.tx@buyer.com");
        buyerUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerToken = jwtService.generateToken(buyerUser);

        supplierUser = new User();
        supplierUser.setName("Supplier Jane");
        supplierUser.setEmail("supplier.jane.tx@supplier.com");
        supplierUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);

        supplier = new Supplier();
        supplier.setName("Apex Solvents");
        supplier.setSlug("apex-solvents-tx");
        supplier.setCountryCode("US");
        supplier.setCountryName("United States");
        supplier.setVerified(true);
        supplier.setUser(supplierUser);
        supplier.setCreatedAt(LocalDateTime.now());
        supplier = supplierRepository.save(supplier);

        product = new Product();
        product.setName("Acetone Reagent Grade");
        product.setDescription("Chemical intermediate");
        product.setPrice(new BigDecimal("120.00"));
        product.setStock(400);
        product.setCategory(ProductCategory.SOLVENT);
        product.setSeller(supplierUser);
        product = productRepository.save(product);

        rfq = new Rfq();
        rfq.setBuyerId(buyerUser.getId());
        rfq.setProductId(product.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setQuantity(new BigDecimal("250.00"));
        rfq.setUnit("KG");
        rfq.setMessage("Urgent requirement");
        rfq.setStatus(RfqStatus.PENDING);
        rfq = rfqRepository.save(rfq);

        po = new PurchaseOrder();
        po.setPoNumber("PO-2026-9999");
        po.setRfqId(rfq.getId());
        po.setQuotationId(rfq.getId());
        po.setBuyerId(buyerUser.getId());
        po.setSupplierId(supplier.getId());
        po.setProductId(product.getId());
        po.setProductName("Acetone Reagent Grade");
        po.setQuantity(new BigDecimal("250.00"));
        po.setUnit("KG");
        po.setUnitPrice(new BigDecimal("115.00"));
        po.setTotalAmount(new BigDecimal("28750.00"));
        po.setCurrency("USD");
        po.setShippingAddress("990 Logistics Blvd, Dallas, TX");
        po.setBillingContact("ap@buyer.com");
        po.setStatus(OrderStatus.PLACED);
        po.setPlacedAt(LocalDateTime.now());
        po = purchaseOrderRepository.save(po);
    }

    @Test
    public void testGetRfqs_SecurityGating() throws Exception {
        // Admin gets 200
        mockMvc.perform(get("/api/v1/admin/transactions/rfqs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].productName").value("Acetone Reagent Grade"));

        // Buyer gets 403
        mockMvc.perform(get("/api/v1/admin/transactions/rfqs")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());

        // Supplier gets 403
        mockMvc.perform(get("/api/v1/admin/transactions/rfqs")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testGetRfqDetail_AdminAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/transactions/rfqs/" + rfq.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(rfq.getId().toString()))
                .andExpect(jsonPath("$.productName").value("Acetone Reagent Grade"));
    }

    @Test
    public void testUpdateRfqStatus_CloseEndpoint_WithAudit() throws Exception {
        UpdateAdminRfqStatusRequest req = new UpdateAdminRfqStatusRequest(RfqStatus.CLOSED, "Buyer unresponsive");

        mockMvc.perform(put("/api/v1/admin/transactions/rfqs/" + rfq.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        assertEquals(1, auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.RFQ, rfq.getId().toString()).size());
        assertEquals(AuditAction.RFQ_STATUS_CHANGED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testGetOrders_SecurityGating() throws Exception {
        mockMvc.perform(get("/api/v1/admin/transactions/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].poNumber").value("PO-2026-9999"));

        mockMvc.perform(get("/api/v1/admin/transactions/orders")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testGetOrderDetail_AdminAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/transactions/orders/" + po.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poNumber").value("PO-2026-9999"))
                .andExpect(jsonPath("$.status").value("PLACED"));
    }

    @Test
    public void testCancelOrder_AdminOnly_WithAudit() throws Exception {
        CancelAdminPurchaseOrderRequest req = new CancelAdminPurchaseOrderRequest("Administrative order dispute");

        mockMvc.perform(put("/api/v1/admin/transactions/orders/" + po.getId() + "/cancel")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertEquals(1, auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(AuditTargetType.PURCHASE_ORDER, po.getId().toString()).size());
        assertEquals(AuditAction.ORDER_CANCELLED, auditLogRepository.findAll().get(0).getAction());
    }

    @Test
    public void testGetRfqs_WithMasterProductAndNullProductId_DoesNotReturn500() throws Exception {
        com.synthora.product.MasterProduct mp = new com.synthora.product.MasterProduct();
        mp.setName("Paracetamol Active Pharmaceutical Ingredient");
        mp.setMasterProductCode("API-MP-99001");
        mp.setCasNumber("103-90-2");
        mp.setCategory(ProductCategory.API);
        mp.setStatus("ACTIVE");
        mp = masterProductRepository.save(mp);

        Rfq modernRfq = new Rfq();
        modernRfq.setBuyerId(buyerUser.getId());
        modernRfq.setMasterProductId(mp.getId());
        modernRfq.setProductId(null); // Explicit null productId
        modernRfq.setSupplierId(supplier.getId());
        modernRfq.setQuantity(new BigDecimal("500.00"));
        modernRfq.setUnit("KG");
        modernRfq.setMessage("High purity API required");
        modernRfq.setStatus(RfqStatus.PENDING);
        modernRfq = rfqRepository.save(modernRfq);

        mockMvc.perform(get("/api/v1/admin/transactions/rfqs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].productName").value("Paracetamol Active Pharmaceutical Ingredient"));

        // Detail endpoint also succeeds
        mockMvc.perform(get("/api/v1/admin/transactions/rfqs/" + modernRfq.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(modernRfq.getId().toString()))
                .andExpect(jsonPath("$.productName").value("Paracetamol Active Pharmaceutical Ingredient"));
    }

    @Test
    public void testGetRfqs_WithNullProductAndNullSupplier_ReturnsSafeFallback() throws Exception {
        Rfq fallbackRfq = new Rfq();
        fallbackRfq.setBuyerId(buyerUser.getId());
        fallbackRfq.setMasterProductId(null);
        fallbackRfq.setProductId(null);
        fallbackRfq.setSupplierOfferingId(null);
        fallbackRfq.setSupplierId(supplier.getId());
        fallbackRfq.setQuantity(new BigDecimal("100.00"));
        fallbackRfq.setUnit("KG");
        fallbackRfq.setMessage("General chemical inquiry");
        fallbackRfq.setStatus(RfqStatus.PENDING);
        fallbackRfq = rfqRepository.save(fallbackRfq);

        mockMvc.perform(get("/api/v1/admin/transactions/rfqs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].productName").value("Specialty Chemical Compound"));
    }

    @Test
    public void testGetRfqs_FilterByStatusAndSearch() throws Exception {
        mockMvc.perform(get("/api/v1/admin/transactions/rfqs")
                        .param("status", "PENDING")
                        .param("query", "urgent")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(rfq.getId().toString()));
    }
}
