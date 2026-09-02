package com.kemkendra.document;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.order.PurchaseOrder;
import com.kemkendra.order.PurchaseOrderRepository;
import com.kemkendra.order.Shipment;
import com.kemkendra.order.ShipmentRepository;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.rfq.Rfq;
import com.kemkendra.rfq.RfqRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class DocumentManagementIntegrationTest {

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
    private ShipmentRepository shipmentRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private JwtService jwtService;

    private User buyer;
    private User supplierUser;
    private Supplier supplier;

    private String buyerToken;
    private String supplierToken;

    private byte[] pdfContent;

    @BeforeEach
    void setUp() {
        pdfContent = "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF".getBytes();

        buyer = new User();
        buyer.setId(UUID.randomUUID());
        buyer.setEmail("buyer_mgmt@kemkendra.com");
        buyer.setName("Management Buyer");
        buyer.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer.setCreatedAt(java.time.Instant.now());
        buyer.setUpdatedAt(java.time.Instant.now());
        buyer = userRepository.save(buyer);

        supplierUser = new User();
        supplierUser.setId(UUID.randomUUID());
        supplierUser.setEmail("supplier_mgmt@kemkendra.com");
        supplierUser.setName("Management Supplier");
        supplierUser.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser.setCreatedAt(java.time.Instant.now());
        supplierUser.setUpdatedAt(java.time.Instant.now());
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setUser(supplierUser);
        supplier.setName("Apex Chemicals");
        supplier.setLegalName("Apex Chemicals India Pvt Ltd");
        supplier.setSlug("apex-chemicals-mgmt");
        supplier.setBusinessEmail(supplierUser.getEmail());
        supplier.setVerificationStatus(com.kemkendra.seller.SupplierVerificationStatus.UNDER_REVIEW);
        supplier = supplierRepository.save(supplier);

        buyerToken = "Bearer " + jwtService.generateToken(buyer);
        supplierToken = "Bearer " + jwtService.generateToken(supplierUser);
    }

    @Test
    @DisplayName("Lineage & Versioning: V1 -> V2 in same group increments version without merging independent documents")
    void versioningAndLineage_isolatedCorrectly() throws Exception {
        MockMultipartFile fileV1 = new MockMultipartFile("file", "gst_v1.pdf", "application/pdf", pdfContent);

        // 1. Upload first GST document (lineage 1)
        String res1 = mockMvc.perform(multipart("/api/v1/documents")
                        .file(fileV1)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "GST_CERTIFICATE")
                        .param("documentNumber", "GST-001")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isActive").value(true))
                .andReturn().getResponse().getContentAsString();

        String groupId1 = com.jayway.jsonpath.JsonPath.read(res1, "$.documentGroupId");
        String docId1 = com.jayway.jsonpath.JsonPath.read(res1, "$.id");
        assertThat(groupId1).isNotNull();

        // 2. Upload second revision in same group (lineage 1 -> V2)
        MockMultipartFile fileV2 = new MockMultipartFile("file", "gst_v2.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(fileV2)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "GST_CERTIFICATE")
                        .param("documentGroupId", groupId1)
                        .param("documentNumber", "GST-001-REV")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.documentGroupId").value(groupId1))
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.isActive").value(true));

        // Verify V1 is now inactive
        Document v1InDb = documentRepository.findById(UUID.fromString(docId1)).orElseThrow();
        assertThat(v1InDb.getIsActive()).isFalse();

        // 3. Upload independent second GST document without documentGroupId (lineage 2 -> V1)
        MockMultipartFile fileIndependent = new MockMultipartFile("file", "another_gst.pdf", "application/pdf", pdfContent);
        String resIndependent = mockMvc.perform(multipart("/api/v1/documents")
                        .file(fileIndependent)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "GST_CERTIFICATE")
                        .param("documentNumber", "GST-BRANCH-02")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isActive").value(true))
                .andReturn().getResponse().getContentAsString();

        String groupId2 = com.jayway.jsonpath.JsonPath.read(resIndependent, "$.documentGroupId");
        assertThat(groupId2).isNotEqualTo(groupId1);

        // 4. Verify version history of lineage 1 contains 2 versions
        mockMvc.perform(get("/api/v1/documents/groups/{groupId}/versions", groupId1)
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].version").value(2))
                .andExpect(jsonPath("$[1].version").value(1));
    }

    @Test
    @DisplayName("Expiry Awareness: Server computes VALID, EXPIRING_SOON, and EXPIRED dynamically")
    void expiryStatus_computedServerSide() throws Exception {
        LocalDate today = LocalDate.now();

        // Valid (> 30 days)
        MockMultipartFile validDoc = new MockMultipartFile("file", "iso_valid.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(validDoc)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "ISO_CERTIFICATE")
                        .param("expiryDate", today.plusDays(90).toString())
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expiryStatus").value("VALID"));

        // Expiring Soon (within 30 days)
        MockMultipartFile expiringDoc = new MockMultipartFile("file", "iso_expiring.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(expiringDoc)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "ISO_CERTIFICATE")
                        .param("expiryDate", today.plusDays(15).toString())
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expiryStatus").value("EXPIRING_SOON"));

        // Expired (past date)
        MockMultipartFile expiredDoc = new MockMultipartFile("file", "iso_expired.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(expiredDoc)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "ISO_CERTIFICATE")
                        .param("expiryDate", today.minusDays(5).toString())
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expiryStatus").value("EXPIRED"));
    }

    @Test
    @DisplayName("Soft Deactivation: Document is marked inactive and retained for audit without deletion")
    void deactivateDocument_softDeactivation() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "license.pdf", "application/pdf", pdfContent);

        String res = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("category", "COMPANY_LICENSE")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String docId = com.jayway.jsonpath.JsonPath.read(res, "$.id");

        // Deactivate
        mockMvc.perform(patch("/api/v1/documents/{id}/deactivate", docId)
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));

        // Active list query excludes it
        mockMvc.perform(get("/api/v1/documents")
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("includeHistory", "false")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Include history query includes it
        mockMvc.perform(get("/api/v1/documents")
                        .param("ownerType", "SUPPLIER")
                        .param("ownerId", supplierUser.getId().toString())
                        .param("includeHistory", "true")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("Commercial Records Attachment: RFQ -> Quotation -> PO -> Shipment document flows")
    void transactionDocumentLifecycle() throws Exception {
        // 1. Buyer creates RFQ and attaches Technical Specification
        Rfq rfq = new Rfq();
        rfq.setBuyerId(buyer.getId());
        rfq.setSupplierId(supplier.getId());
        rfq.setProductId(UUID.randomUUID());
        rfq.setStatus(com.kemkendra.rfq.RfqStatus.PENDING);
        rfq.setQuantity(BigDecimal.valueOf(500));
        rfq.setUnit("KG");
        rfq = rfqRepository.save(rfq);

        MockMultipartFile rfqDoc = new MockMultipartFile("file", "rfq_spec.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(rfqDoc)
                        .param("ownerType", "RFQ")
                        .param("ownerId", rfq.getId().toString())
                        .param("category", "RFQ_ATTACHMENT")
                        .header(HttpHeaders.AUTHORIZATION, buyerToken))
                .andExpect(status().isCreated());

        // 2. Supplier attaches Quotation Spec
        Quotation quote = new Quotation();
        quote.setRfq(rfq);
        quote.setQuotationVersion(1);
        quote.setUnitPrice(BigDecimal.valueOf(25));
        quote.setCurrency("INR");
        quote.setValidityDate(LocalDate.now().plusDays(30));
        quote.setActorType("SUPPLIER");
        quote = quotationRepository.save(quote);

        MockMultipartFile quoteDoc = new MockMultipartFile("file", "quote_breakdown.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(quoteDoc)
                        .param("ownerType", "QUOTATION")
                        .param("ownerId", quote.getId().toString())
                        .param("category", "QUOTATION_ATTACHMENT")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated());

        // 3. Purchase Order issued and PO document attached
        PurchaseOrder po = new PurchaseOrder();
        po.setRfqId(rfq.getId());
        po.setQuotationId(quote.getId());
        po.setBuyerId(buyer.getId());
        po.setSupplierId(supplier.getId());
        po.setProductId(rfq.getProductId());
        po.setQuantity(rfq.getQuantity());
        po.setUnit(rfq.getUnit());
        po.setUnitPrice(quote.getUnitPrice());
        po.setCurrency("INR");
        po.setPoNumber("PO-E2E-100");
        po.setStatus(com.kemkendra.order.OrderStatus.PLACED);
        po.setTotalAmount(BigDecimal.valueOf(12500));
        po.setShippingAddress("Mumbai");
        po.setBillingContact("Contact");
        po.setPlacedAt(LocalDateTime.now());
        po = purchaseOrderRepository.save(po);

        MockMultipartFile poDoc = new MockMultipartFile("file", "purchase_order_signed.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(poDoc)
                        .param("ownerType", "PURCHASE_ORDER")
                        .param("ownerId", po.getId().toString())
                        .param("category", "PURCHASE_ORDER")
                        .header(HttpHeaders.AUTHORIZATION, buyerToken))
                .andExpect(status().isCreated());

        // 4. Shipment created and Delivery Confirmation attached
        Shipment shipment = new Shipment();
        shipment.setPurchaseOrder(po);
        shipment.setTrackingNumber("TRK-BLUEDART-999");
        shipment.setCarrier("BlueDart");
        shipment.setShippedAt(LocalDateTime.now());
        shipment = shipmentRepository.save(shipment);

        MockMultipartFile shipDoc = new MockMultipartFile("file", "delivery_receipt.pdf", "application/pdf", pdfContent);
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(shipDoc)
                        .param("ownerType", "SHIPMENT")
                        .param("ownerId", shipment.getId().toString())
                        .param("category", "DELIVERY_CONFIRMATION")
                        .header(HttpHeaders.AUTHORIZATION, supplierToken))
                .andExpect(status().isCreated());

        // Buyer can read all transaction documents across the flow
        mockMvc.perform(get("/api/v1/documents").param("ownerType", "RFQ").param("ownerId", rfq.getId().toString()).header(HttpHeaders.AUTHORIZATION, buyerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/v1/documents").param("ownerType", "PURCHASE_ORDER").param("ownerId", po.getId().toString()).header(HttpHeaders.AUTHORIZATION, buyerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/v1/documents").param("ownerType", "SHIPMENT").param("ownerId", shipment.getId().toString()).header(HttpHeaders.AUTHORIZATION, buyerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
    }
}
