package com.synthora.order.apis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.order.OrderStatus;
import com.synthora.order.PurchaseOrder;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.order.ShipmentRepository;
import com.synthora.order.dto.ShipOrderRequest;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.rfq.Rfq;
import com.synthora.rfq.RfqRepository;
import com.synthora.rfq.RfqStatus;
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
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PurchaseOrderFulfillmentApiControllerTest {

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
    private ProductRepository productRepository;

    @Autowired
    private RfqRepository rfqRepository;

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User buyerA;
    private String buyerAToken;

    private User buyerB;
    private String buyerBToken;

    private User supplierUserA;
    private Supplier supplierA;
    private String supplierAToken;

    private User supplierUserB;
    private Supplier supplierB;
    private String supplierBToken;

    private PurchaseOrder purchaseOrderA;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        buyerA = createUser("buyerA@synthora.com", UserRole.USER);
        buyerAToken = jwtService.generateToken(buyerA);

        buyerB = createUser("buyerB@synthora.com", UserRole.USER);
        buyerBToken = jwtService.generateToken(buyerB);

        supplierUserA = createUser("supplierA@synthora.com", UserRole.SUPPLIER);
        supplierAToken = jwtService.generateToken(supplierUserA);
        supplierA = createSupplier(supplierUserA);

        supplierUserB = createUser("supplierB@synthora.com", UserRole.SUPPLIER);
        supplierBToken = jwtService.generateToken(supplierUserB);
        supplierB = createSupplier(supplierUserB);

        Product product = createProduct(supplierUserA);
        Rfq rfq = createRfq(buyerA, supplierA, product);
        Quotation quotation = createQuotation(rfq);
        rfq.setAcceptedQuotationId(quotation.getId());
        rfqRepository.save(rfq);

        purchaseOrderA = createPurchaseOrder(buyerA, supplierA, product, rfq, quotation);
    }

    private User createUser(String email, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setName("Name");
        user.setPasswordHash("hash123");
        user.setRole(role);
        return userRepository.save(user);
    }

    private Supplier createSupplier(User user) {
        Supplier supplier = new Supplier();
        supplier.setUser(user);
        return supplierRepository.save(supplier);
    }

    private Product createProduct(User seller) {
        Product product = new Product();
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(100.00));
        product.setStock(500);
        product.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        product.setSeller(seller);
        return productRepository.save(product);
    }

    private Rfq createRfq(User buyer, Supplier supplier, Product product) {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(BigDecimal.valueOf(50.00));
        rfq.setUnit("MT");
        rfq.setStatus(RfqStatus.ACCEPTED);
        return rfqRepository.save(rfq);
    }

    private Quotation createQuotation(Rfq rfq) {
        Quotation quotation = new Quotation();
        quotation.setRfq(rfq);
        quotation.setQuotationVersion(1);
        quotation.setUnitPrice(BigDecimal.valueOf(125.5));
        quotation.setCurrency("USD");
        quotation.setMinimumOrderQuantity(BigDecimal.valueOf(10.0));
        quotation.setValidityDate(LocalDate.now().plusMonths(1));
        return quotationRepository.save(quotation);
    }

    private PurchaseOrder createPurchaseOrder(User buyer, Supplier supplier, Product product, Rfq rfq, Quotation quotation) {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-2026-1000");
        po.setRfqId(rfq.getId());
        po.setQuotationId(quotation.getId());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(supplier.getId());
        po.setProductId(product.getId());
        po.setQuantity(BigDecimal.valueOf(50));
        po.setUnit("MT");
        po.setUnitPrice(BigDecimal.valueOf(125.5));
        po.setTotalAmount(BigDecimal.valueOf(6275));
        po.setCurrency("USD");
        po.setShippingAddress("Address");
        po.setBillingContact("Billing");
        po.setStatus(OrderStatus.CONFIRMED);
        po.setPlacedAt(LocalDateTime.now());
        po.setConfirmedAt(LocalDateTime.now());
        return purchaseOrderRepository.save(po);
    }

    @Test
    public void testFullFulfillmentLifecycle() throws Exception {
        // 1. Process Order (Supplier A)
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"));

        // 2. Ship Order (Supplier A)
        ShipOrderRequest shipReq = new ShipOrderRequest("FedEx", "123456", LocalDate.now().plusDays(2));
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));

        // 3. Get Shipment (Buyer A)
        mockMvc.perform(get("/api/v1/orders/{id}/shipment", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carrier").value("FedEx"))
                .andExpect(jsonPath("$.trackingNumber").value("123456"));

        // 4. Deliver Order (Supplier A)
        mockMvc.perform(post("/api/v1/orders/{id}/deliver", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    public void testSupplierIdorSecurity() throws Exception {
        // Supplier B trying to process Supplier A's order
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierBToken))
                .andExpect(status().isNotFound());

        // Change status to PROCESSING to test ship IDOR
        purchaseOrderA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrderA);

        ShipOrderRequest shipReq = new ShipOrderRequest("FedEx", "123456", null);
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierBToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testBuyerIdorSecurity() throws Exception {
        purchaseOrderA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrderA);

        ShipOrderRequest shipReq = new ShipOrderRequest("FedEx", "123456", null);
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isOk());

        // Buyer B trying to get shipment for Buyer A's order
        mockMvc.perform(get("/api/v1/orders/{id}/shipment", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + buyerBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testRoleMismatchSecurity() throws Exception {
        // Buyer trying to call supplier endpoint
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + buyerAToken))
                .andExpect(status().isForbidden());
                
        // Unauthenticated
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/process", purchaseOrderA.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testValidationErrors() throws Exception {
        purchaseOrderA.setStatus(OrderStatus.PROCESSING);
        purchaseOrderRepository.save(purchaseOrderA);

        ShipOrderRequest shipReq = new ShipOrderRequest("", "  ", null);
        mockMvc.perform(post("/api/v1/orders/supplier/{id}/ship", purchaseOrderA.getId())
                .header("Authorization", "Bearer " + supplierAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isBadRequest());
    }
}
