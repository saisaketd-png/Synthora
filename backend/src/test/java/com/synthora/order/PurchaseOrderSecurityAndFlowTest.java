package com.synthora.order;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PurchaseOrderSecurityAndFlowTest {

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
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private com.synthora.order.ShipmentRepository shipmentRepository;

    private User buyer1;
    private String buyer1Token;

    private User buyer2;
    private String buyer2Token;

    private User supplierUser1;
    private Supplier supplier1;
    private String supplier1Token;

    private User supplierUser2;
    private Supplier supplier2;
    private String supplier2Token;

    private Product product;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        buyer1 = new User();
        buyer1.setEmail("buyer1@synthora.com");
        buyer1.setName("Buyer One");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        buyer2 = new User();
        buyer2.setEmail("buyer2@synthora.com");
        buyer2.setName("Buyer Two");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        supplierUser1 = new User();
        supplierUser1.setEmail("seller1@synthora.com");
        supplierUser1.setName("Seller One");
        supplierUser1.setPasswordHash("hash123");
        supplierUser1.setRole(UserRole.SUPPLIER);
        supplierUser1.setStatus(UserStatus.ACTIVE);
        supplierUser1 = userRepository.save(supplierUser1);
        supplier1Token = jwtService.generateToken(supplierUser1);

        supplier1 = new Supplier();
        supplier1.setUser(supplierUser1);
        supplier1 = supplierRepository.save(supplier1);

        supplierUser2 = new User();
        supplierUser2.setEmail("seller2@synthora.com");
        supplierUser2.setName("Seller Two");
        supplierUser2.setPasswordHash("hash123");
        supplierUser2.setRole(UserRole.SUPPLIER);
        supplierUser2.setStatus(UserStatus.ACTIVE);
        supplierUser2 = userRepository.save(supplierUser2);
        supplier2Token = jwtService.generateToken(supplierUser2);

        supplier2 = new Supplier();
        supplier2.setUser(supplierUser2);
        supplier2 = supplierRepository.save(supplier2);

        product = new Product();
        product.setName("Industrial Sulfuric Acid");
        product.setDescription("98% pure");
        product.setPrice(BigDecimal.valueOf(100.00));
        product.setStock(500);
        product.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        product.setSeller(supplierUser1);
        product = productRepository.save(product);
    }

    private Rfq createAcceptedRfq(User buyer, Supplier supplier, Product product) {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(BigDecimal.valueOf(50.00));
        rfq.setUnit("MT");
        rfq.setMessage("Bulk procurement");
        rfq.setStatus(RfqStatus.QUOTED);
        rfq = rfqRepository.save(rfq);

        Quotation quotation = new Quotation();
        quotation.setRfq(rfq);
        quotation.setQuotationVersion(1);
        quotation.setUnitPrice(BigDecimal.valueOf(125.5000));
        quotation.setCurrency("USD");
        quotation.setMinimumOrderQuantity(BigDecimal.valueOf(10.0000));
        quotation.setLeadTimeDays(14);
        quotation.setValidityDate(LocalDate.now().plusMonths(1));
        quotation.setPackagingDetails("ISO Tank");
        quotation = quotationRepository.save(quotation);

        rfq.setStatus(RfqStatus.ACCEPTED);
        rfq.setAcceptedQuotationId(quotation.getId());
        return rfqRepository.save(rfq);
    }

    @Test
    public void testBuyerCreatesPoSuccess() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road, Warehouse 4B, Houston, TX 77001",
                    "billingContact": "accounts@buyer1.com",
                    "notes": "Deliver strictly between 8 AM and 4 PM."
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.poNumber", startsWith("PO-")))
                .andExpect(jsonPath("$.rfqId").value(rfq.getId().toString()))
                .andExpect(jsonPath("$.quotationId").value(rfq.getAcceptedQuotationId().toString()))
                .andExpect(jsonPath("$.buyerId").value(buyer1.getId().toString()))
                .andExpect(jsonPath("$.supplierId").value(supplier1.getId().intValue()))
                .andExpect(jsonPath("$.productId").value(product.getId().toString()))
                .andExpect(jsonPath("$.productName").value("Industrial Sulfuric Acid"))
                .andExpect(jsonPath("$.quantity").value(50.0))
                .andExpect(jsonPath("$.unit").value("MT"))
                .andExpect(jsonPath("$.unitPrice").value(125.5))
                .andExpect(jsonPath("$.totalAmount").value(6275.0)) // 50 * 125.5 = 6275.0000
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.agreedLeadTimeDays").value(14))
                .andExpect(jsonPath("$.shippingAddress").value("123 Port Road, Warehouse 4B, Houston, TX 77001"))
                .andExpect(jsonPath("$.billingContact").value("accounts@buyer1.com"))
                .andExpect(jsonPath("$.notes").value("Deliver strictly between 8 AM and 4 PM."))
                .andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.placedAt").isNotEmpty())
                .andExpect(jsonPath("$.confirmedAt").isEmpty());

        assertEquals(1, purchaseOrderRepository.count());
    }

    @Test
    public void testDuplicatePoForSameRfqYields409() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road, Houston, TX",
                    "billingContact": "accounts@buyer1.com"
                }
                """.formatted(rfq.getId());

        // First attempt succeeds
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        // Second attempt fails with 409 Conflict
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict());

        assertEquals(1, purchaseOrderRepository.count());
    }

    @Test
    public void testBuyerCannotCreatePoForOtherBuyersRfq() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "456 Market St, Chicago, IL",
                    "billingContact": "billing@buyer2.com"
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isNotFound());

        assertEquals(0, purchaseOrderRepository.count());
    }

    @Test
    public void testBuyerCannotCreatePoForNonAcceptedRfq() throws Exception {
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer1.getId());
        rfq.setSupplierId(supplier1.getId());
        rfq.setProductId(product.getId());
        rfq.setQuantity(BigDecimal.valueOf(10.0));
        rfq.setUnit("KG");
        rfq.setStatus(RfqStatus.QUOTED);
        rfq = rfqRepository.save(rfq);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road",
                    "billingContact": "accounts@buyer1.com"
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict());
    }

    @Test
    public void testSupplierCannotCreatePo() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road",
                    "billingContact": "seller@apex.com"
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + supplier1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnauthenticatedCannotCreatePo() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road",
                    "billingContact": "anon@test.com"
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testBuyerOrderListAndDetailIsolation() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road, Houston, TX",
                    "billingContact": "accounts@buyer1.com"
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        PurchaseOrder po = purchaseOrderRepository.findAll().get(0);

        // Buyer 1 can list own orders
        mockMvc.perform(get("/api/v1/orders/my")
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].poNumber").value(po.getPoNumber()));

        // Buyer 1 can view own order detail
        mockMvc.perform(get("/api/v1/orders/" + po.getId())
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(po.getId().toString()));

        // Buyer 2 cannot list Buyer 1's orders
        mockMvc.perform(get("/api/v1/orders/my")
                        .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Buyer 2 receives 404 when querying Buyer 1's order detail
        mockMvc.perform(get("/api/v1/orders/" + po.getId())
                        .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testSupplierOrderListDetailAndConfirmationFlow() throws Exception {
        Rfq rfq = createAcceptedRfq(buyer1, supplier1, product);

        String requestJson = """
                {
                    "rfqId": "%s",
                    "shippingAddress": "123 Port Road, Houston, TX",
                    "billingContact": "accounts@buyer1.com"
                }
                """.formatted(rfq.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + buyer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated());

        PurchaseOrder po = purchaseOrderRepository.findAll().get(0);

        // Supplier 1 can view assigned orders
        mockMvc.perform(get("/api/v1/orders/supplier")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].poNumber").value(po.getPoNumber()))
                .andExpect(jsonPath("$[0].status").value("PLACED"));

        // Supplier 1 can view assigned order detail
        mockMvc.perform(get("/api/v1/orders/supplier/" + po.getId())
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PLACED"));

        // Supplier 2 cannot view Supplier 1's order
        mockMvc.perform(get("/api/v1/orders/supplier/" + po.getId())
                        .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isNotFound());

        // Supplier 2 cannot confirm Supplier 1's order
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isNotFound());

        // Buyer cannot hit supplier confirmation endpoint
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isForbidden());

        // Supplier 1 confirms order -> 200 OK
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmedAt").isNotEmpty());

        // Confirming again yields 409 Conflict
        mockMvc.perform(post("/api/v1/orders/supplier/" + po.getId() + "/confirm")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isConflict());

        // Verify DB state
        PurchaseOrder updatedPo = purchaseOrderRepository.findById(po.getId()).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, updatedPo.getStatus());
        assertNotNull(updatedPo.getConfirmedAt());
    }
}
