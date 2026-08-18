package com.synthora.common;

import com.synthora.SynthoraApplication;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.order.PurchaseOrderRepository;
import com.synthora.product.Product;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SynthoraApplication.class)
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
    private com.synthora.order.ShipmentRepository shipmentRepository;

    @Autowired
    private JwtService jwtService;

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
        shipmentRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Buyer 1
        buyer1 = new User();
        buyer1.setEmail("buyer1@synthora.com");
        buyer1.setName("Buyer One");
        buyer1.setPasswordHash("hash123");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        // 2. Buyer 2
        buyer2 = new User();
        buyer2.setEmail("buyer2@synthora.com");
        buyer2.setName("Buyer Two");
        buyer2.setPasswordHash("hash123");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        // 3. Supplier 1
        supplierUser1 = new User();
        supplierUser1.setEmail("supplier1@synthora.com");
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
        product.setCategory(com.synthora.product.ProductCategory.API);
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
                .andExpect(jsonPath("$.error").value("RFQ not found"));
    }

    @Test
    public void testCrossTenantAccessReturns404ToMaskExistence() throws Exception {
        // Buyer 2 attempting to access Buyer 1's RFQ
        mockMvc.perform(get("/api/v1/rfqs/" + rfq1.getId())
                        .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("RFQ not found"));
    }

    @Test
    public void testDuplicateRegistrationReturns400BadRequest() throws Exception {
        String duplicateRegisterPayload = """
                {
                    "name": "Duplicate User",
                    "email": "buyer1@synthora.com",
                    "password": "Password123!",
                    "phone": "1234567890"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateRegisterPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    public void testInvalidLoginReturns400BadRequest() throws Exception {
        String invalidLoginPayload = """
                {
                    "email": "nonexistent@synthora.com",
                    "password": "WrongPassword!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidLoginPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
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
                .andExpect(jsonPath("$.error").value("Cannot submit quotation for RFQ in status: ACCEPTED"));
    }
}
