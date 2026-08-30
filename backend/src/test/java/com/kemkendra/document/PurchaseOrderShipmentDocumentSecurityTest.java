package com.kemkendra.document;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.Shipment;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.product.ProductRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.seller.SellerProfileRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PurchaseOrderShipmentDocumentSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

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
    private DocumentRepository documentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User buyer1;
    private User buyer2;
    private User supplier1User;
    private User supplier2User;
    private Supplier supplier1;
    private String buyer1Token;
    private String buyer2Token;
    private String supplier1Token;
    private String supplier2Token;

    private PurchaseOrder testPo;
    private Shipment testShipment;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        buyer1 = new User();
        buyer1.setEmail("buyer1@test.com");
        buyer1.setName("Buyer 1");
        buyer1.setPasswordHash("hash");
        buyer1.setRole(UserRole.USER);
        buyer1.setStatus(com.kemkendra.identity.UserStatus.ACTIVE);
        buyer1 = userRepository.save(buyer1);
        buyer1Token = jwtService.generateToken(buyer1);

        buyer2 = new User();
        buyer2.setEmail("buyer2@test.com");
        buyer2.setName("Buyer 2");
        buyer2.setPasswordHash("hash");
        buyer2.setRole(UserRole.USER);
        buyer2.setStatus(com.kemkendra.identity.UserStatus.ACTIVE);
        buyer2 = userRepository.save(buyer2);
        buyer2Token = jwtService.generateToken(buyer2);

        supplier1User = new User();
        supplier1User.setEmail("supp1@test.com");
        supplier1User.setName("Supp 1");
        supplier1User.setPasswordHash("hash");
        supplier1User.setRole(UserRole.SUPPLIER);
        supplier1User.setStatus(com.kemkendra.identity.UserStatus.ACTIVE);
        supplier1User = userRepository.save(supplier1User);
        supplier1Token = jwtService.generateToken(supplier1User);

        supplier1 = new Supplier();
        supplier1.setUser(supplier1User);
        supplier1.setName("Company 1");
        supplier1.setSlug("company-1");
        supplier1.setCountryCode("US");
        supplier1.setCountryName("United States");
        supplier1 = supplierRepository.save(supplier1);

        supplier2User = new User();
        supplier2User.setEmail("supp2@test.com");
        supplier2User.setName("Supp 2");
        supplier2User.setPasswordHash("hash");
        supplier2User.setRole(UserRole.SUPPLIER);
        supplier2User.setStatus(com.kemkendra.identity.UserStatus.ACTIVE);
        supplier2User = userRepository.save(supplier2User);
        supplier2Token = jwtService.generateToken(supplier2User);

        Rfq testRfq = new Rfq();
        testRfq.setBuyerId(buyer1.getId());
        testRfq.setProductId(UUID.randomUUID());
        testRfq.setSupplierId(supplier1.getId());
        testRfq.setQuantity(new BigDecimal("100"));
        testRfq.setUnit("KG");
        testRfq.setStatus(RfqStatus.ACCEPTED);
        testRfq = rfqRepository.save(testRfq);

        Quotation testQuotation = new Quotation();
        testQuotation.setRfq(testRfq);
        testQuotation.setQuotationVersion(1);
        testQuotation.setUnitPrice(new BigDecimal("10.5"));
        testQuotation.setCurrency("USD");
        testQuotation.setValidityDate(LocalDate.now().plusDays(30));
        testQuotation = quotationRepository.save(testQuotation);

        testPo = new PurchaseOrder();
        testPo.setPoNumber("PO-0001");
        testPo.setRfqId(testRfq.getId());
        testPo.setQuotationId(testQuotation.getId());
        testPo.setBuyerId(buyer1.getId());
        testPo.setSupplierId(supplier1.getId());
        testPo.setProductId(testRfq.getProductId());
        testPo.setQuantity(testRfq.getQuantity());
        testPo.setUnit(testRfq.getUnit());
        testPo.setUnitPrice(testQuotation.getUnitPrice());
        testPo.setTotalAmount(new BigDecimal("1050"));
        testPo.setCurrency(testQuotation.getCurrency());
        testPo.setShippingAddress("Address");
        testPo.setBillingContact("Contact");
        testPo.setStatus(OrderStatus.SHIPPED);
        testPo.setPlacedAt(LocalDateTime.now());
        testPo = purchaseOrderRepository.save(testPo);

        testShipment = new Shipment();
        testShipment.setPurchaseOrder(testPo);
        testShipment.setCarrier("DHL");
        testShipment.setTrackingNumber("123456");
        testShipment.setShippedAt(LocalDateTime.now());
        testShipment = shipmentRepository.save(testShipment);
    }

    private MockMultipartFile createMockFile() {
        return new MockMultipartFile("file", "test.pdf", "application/pdf", "%PDF-1.4 valid test pdf content".getBytes());
    }

    // --- PURCHASE ORDER Document Tests ---

    @Test
    public void buyerCanUploadPoDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "PURCHASE_ORDER")
                .param("ownerId", testPo.getId().toString())
                .param("category", "PURCHASE_ORDER")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void supplierAssignedCanUploadPoDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "PURCHASE_ORDER")
                .param("ownerId", testPo.getId().toString())
                .param("category", "INVOICE")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void supplierCannotDeleteBuyerUploadedPoDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "PURCHASE_ORDER")
                .param("ownerId", testPo.getId().toString())
                .param("category", "PURCHASE_ORDER")
                .header("Authorization", "Bearer " + buyer1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(delete("/api/v1/documents/" + docId)
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void supplierCanDeleteOwnUploadedPoDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "PURCHASE_ORDER")
                .param("ownerId", testPo.getId().toString())
                .param("category", "INVOICE")
                .header("Authorization", "Bearer " + supplier1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(delete("/api/v1/documents/" + docId)
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isNoContent());
    }

    @Test
    public void unrelatedBuyerCannotAccessPoDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "PURCHASE_ORDER")
                .param("ownerId", testPo.getId().toString())
                .param("category", "PURCHASE_ORDER")
                .header("Authorization", "Bearer " + buyer1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                .header("Authorization", "Bearer " + buyer2Token))
                .andExpect(status().isForbidden());
    }

    // --- SHIPMENT Document Tests ---

    @Test
    public void supplierCanUploadShipmentDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "SHIPMENT")
                .param("ownerId", testShipment.getId().toString())
                .param("category", "PACKING_LIST")
                .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isCreated());
    }

    @Test
    public void buyerCannotUploadShipmentDocument() throws Exception {
        mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "SHIPMENT")
                .param("ownerId", testShipment.getId().toString())
                .param("category", "PACKING_LIST")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void buyerCanViewShipmentDocument() throws Exception {
        String res = mockMvc.perform(multipart("/api/v1/documents")
                .file(createMockFile())
                .param("ownerType", "SHIPMENT")
                .param("ownerId", testShipment.getId().toString())
                .param("category", "PACKING_LIST")
                .header("Authorization", "Bearer " + supplier1Token))
                .andReturn().getResponse().getContentAsString();
        String docId = res.split("\"id\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                .header("Authorization", "Bearer " + buyer1Token))
                .andExpect(status().isOk());
    }
}
