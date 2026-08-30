package com.kemkendra.common;

import com.kemkendra.KemKendraApplication;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.product.Product;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = KemKendraApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GlobalExceptionSemanticsTest {

    @Autowired
    private MockMvc mockMvc;

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
    private com.kemkendra.order.ShipmentRepository shipmentRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User buyer1;
    private String buyer1Token;

    private User buyer2;
    private String buyer2Token;

    private User supplierUser1;
    private Supplier supplier1;
    private String supplier1Token;

    private Product product;
    private Rfq rfq1;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        // 1. Buyer 1
        buyer1 = new User();
        buyer1.setEmail("buyer1@kemkendra.com");
        buyer1.setName("Buyer One");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        // 2. Buyer 2
        buyer2 = new User();
        buyer2.setEmail("buyer2@kemkendra.com");
        buyer2.setName("Buyer Two");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        // 3. Supplier 1
        supplierUser1 = new User();
        supplierUser1.setEmail("supplier1@kemkendra.com");
        supplierUser1.setName("Supplier One");
        supplierUser1.setPasswordHash("hash123");
        supplierUser1.setRole(UserRole.SUPPLIER);
        supplierUser1.setStatus(UserStatus.ACTIVE);
        supplierUser1 = userRepository.save(supplierUser1);
        supplier1Token = jwtService.generateToken(supplierUser1);

        supplier1 = new Supplier();
        supplier1.setUser(supplierUser1);
        supplier1 = supplierRepository.save(supplier1);

        // 4. Product
        product = new Product();
        product.setName("Paracetamol API");
        product.setPrice(new BigDecimal("100.00"));
        product.setStock(5000);
        product.setCategory(com.kemkendra.product.ProductCategory.API);
        product.setSeller(supplierUser1);
        product = productRepository.save(product);

        // 5. RFQ 1 owned by Buyer 1
        rfq1 = new Rfq();
        rfq1.setBuyerId(buyer1.getId());
        rfq1.setProductId(product.getId());
        rfq1.setSupplierId(supplier1.getId());
        rfq1.setQuantity(new BigDecimal("1000.00"));
        rfq1.setUnit("KG");
        rfq1.setStatus(RfqStatus.PENDING);
        rfq1 = rfqRepository.save(rfq1);
    }

    @Test
    public void testNonexistentResourceReturns404() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(get("/api/v1/rfqs/" + randomId)
                        .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("RFQ not found"));
    }

    @Test
    public void testCrossTenantAccessReturns404ToMaskExistence() throws Exception {
        // Buyer 2 attempting to access Buyer 1's RFQ
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId())
                        .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("RFQ not found"));
    }

    @Test
    public void testDuplicateRegistrationReturns400BadRequest() throws Exception {
        String duplicateRegisterPayload = """
                {
                    "name": "Duplicate User",
                    "email": "buyer1@kemkendra.com",
                    "password": "Password123!",
                    "phone": "1234567890",
                    "termsAccepted": true,
                    "privacyAccepted": true
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateRegisterPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    public void testInvalidLoginReturns400BadRequest() throws Exception {
        String invalidLoginPayload = """
                {
                    "email": "nonexistent@kemkendra.com",
                    "password": "WrongPassword!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidLoginPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    public void testBusinessLifecycleConflictReturns409Conflict() throws Exception {
        // Mark RFQ as ACCEPTED
        rfq1.setStatus(RfqStatus.ACCEPTED);
        rfqRepository.save(rfq1);

        String quotationPayload = """
                {
                    "unitPrice": 120.50,
                    "currency": "USD",
                    "minimumOrderQuantity": 100,
                    "leadTimeDays": 14,
                    "validityDate": "%s",
                    "packagingDetails": "25kg fiber drums",
                    "commercialNotes": "Standard payment"
                }
                """.formatted(LocalDate.now().plusDays(30));

        // Supplier attempting to quote on terminal ACCEPTED RFQ
        mockMvc.perform(post("/api/v1/rfqs/supplier/" + rfq1.getId() + "/quotations")
                        .header("Authorization", "Bearer " + supplier1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(quotationPayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cannot submit quotation for RFQ in status: ACCEPTED"));
    }
}
