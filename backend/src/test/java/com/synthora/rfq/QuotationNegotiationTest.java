package com.synthora.rfq;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
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
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class QuotationNegotiationTest {

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
    private com.synthora.notification.NotificationRepository notificationRepository;

    private User buyer;
    private User supplierUser;
    private User unauthorizedBuyer;
    private Supplier supplier;
    private String buyerToken;
    private String supplierToken;
    private String unauthorizedToken;
    private Rfq testRfq;

    @BeforeEach
    public void setUp() {
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        buyer = new User();
        buyer.setName("Buyer " + suffix);
        buyer.setEmail("buyer_" + suffix + "@test.com");
        buyer.setPasswordHash("hash");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer = userRepository.save(buyer);

        unauthorizedBuyer = new User();
        unauthorizedBuyer.setName("Unauth Buyer " + suffix);
        unauthorizedBuyer.setEmail("unauth_" + suffix + "@test.com");
        unauthorizedBuyer.setPasswordHash("hash");
        unauthorizedBuyer.setRole(UserRole.USER);
        unauthorizedBuyer.setStatus(UserStatus.ACTIVE);
        unauthorizedBuyer = userRepository.save(unauthorizedBuyer);

        supplierUser = new User();
        supplierUser.setName("Supplier " + suffix);
        supplierUser.setEmail("supplier_" + suffix + "@test.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("Supplier Corp " + suffix);
        supplier.setSlug("supplier-corp-" + suffix);
        supplier.setCountryName("India");
        supplier.setCountryCode("IN");
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        buyerToken = jwtService.generateToken(buyer);
        supplierToken = jwtService.generateToken(supplierUser);
        unauthorizedToken = jwtService.generateToken(unauthorizedBuyer);

        testRfq = new Rfq();
        testRfq.setBuyerId(buyer.getId());
        testRfq.setSupplierId(supplier.getId());
        testRfq.setProductId(UUID.randomUUID());
        testRfq.setQuantity(new BigDecimal("100.00"));
        testRfq.setUnit("KG");
        testRfq.setMessage("Initial quotation request");
        testRfq.setStatus(RfqStatus.PENDING);
        testRfq = rfqRepository.save(testRfq);
    }

    @Test
    public void testFullNegotiationLifecycle_SupplierQuote_BuyerCounter_SupplierRevise() throws Exception {
        // 1. Supplier submits Initial Quotation (V1)
        String supplierQuoteJson = """
                {
                    "unitPrice": 1250.00,
                    "currency": "INR",
                    "minimumOrderQuantity": 25.0,
                    "leadTimeDays": 7,
                    "validityDate": "%s",
                    "packagingDetails": "25 KG DRUMS",
                    "commercialNotes": "Initial quotation terms"
                }
                """.formatted(LocalDate.now().plusDays(30));

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + testRfq.getId() + "/quotations")
                .header("Authorization", "Bearer " + supplierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(supplierQuoteJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quotationVersion").value(1))
                .andExpect(jsonPath("$.actorType").value("SUPPLIER"))
                .andExpect(jsonPath("$.actionType").value("INITIAL_QUOTATION"));

        Rfq updatedRfq = rfqRepository.findById(testRfq.getId()).orElseThrow();
        assertEquals(RfqStatus.QUOTED, updatedRfq.getStatus());

        // 2. Buyer submits Counter Offer (V2)
        String counterOfferJson = """
                {
                    "unitPrice": 1150.00,
                    "currency": "INR",
                    "minimumOrderQuantity": 25.0,
                    "leadTimeDays": 10,
                    "packagingDetails": "25 KG DRUMS",
                    "commercialMessage": "We can proceed at this price for requested volume."
                }
                """;

        mockMvc.perform(post("/api/v1/rfqs/" + testRfq.getId() + "/counter-offer")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(counterOfferJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quotationVersion").value(2))
                .andExpect(jsonPath("$.actorType").value("BUYER"))
                .andExpect(jsonPath("$.actionType").value("COUNTER_OFFER"))
                .andExpect(jsonPath("$.commercialMessage").value("We can proceed at this price for requested volume."));

        updatedRfq = rfqRepository.findById(testRfq.getId()).orElseThrow();
        assertEquals(RfqStatus.COUNTERED, updatedRfq.getStatus());

        // 3. Supplier submits Revised Quotation (V3)
        String revisedQuoteJson = """
                {
                    "unitPrice": 1200.00,
                    "currency": "INR",
                    "minimumOrderQuantity": 25.0,
                    "leadTimeDays": 8,
                    "validityDate": "%s",
                    "packagingDetails": "25 KG DRUMS",
                    "commercialNotes": "Compromise offer at 1200 INR"
                }
                """.formatted(LocalDate.now().plusDays(30));

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + testRfq.getId() + "/quotations")
                .header("Authorization", "Bearer " + supplierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(revisedQuoteJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quotationVersion").value(3))
                .andExpect(jsonPath("$.actorType").value("SUPPLIER"))
                .andExpect(jsonPath("$.actionType").value("REVISED_QUOTATION"));

        // 4. Verify Revision History Order (Latest First)
        List<Quotation> quotes = quotationRepository.findByRfqIdOrderByQuotationVersionDesc(testRfq.getId());
        assertEquals(3, quotes.size());
        assertEquals(3, quotes.get(0).getQuotationVersion());
        assertEquals("SUPPLIER", quotes.get(0).getActorType());
        assertEquals(2, quotes.get(1).getQuotationVersion());
        assertEquals("BUYER", quotes.get(1).getActorType());
        assertEquals(1, quotes.get(2).getQuotationVersion());
        assertEquals("SUPPLIER", quotes.get(2).getActorType());
    }

    @Test
    public void testCounterOfferAndRevisionNotificationDelivery() throws Exception {
        // 1. Supplier submits initial quotation
        String supplierQuoteJson = """
                {
                    "unitPrice": 1500.00,
                    "currency": "INR",
                    "validityDate": "%s"
                }
                """.formatted(LocalDate.now().plusDays(30));

        mockMvc.perform(post("/api/v1/rfqs/supplier/" + testRfq.getId() + "/quotations")
                .header("Authorization", "Bearer " + supplierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(supplierQuoteJson))
                .andExpect(status().isCreated());

        // 2. Buyer submits counter offer
        String counterOfferJson = """
                {
                    "unitPrice": 1350.00,
                    "currency": "INR",
                    "commercialMessage": "Counter offer for test notification"
                }
                """;

        mockMvc.perform(post("/api/v1/rfqs/" + testRfq.getId() + "/counter-offer")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(counterOfferJson))
                .andExpect(status().isCreated());

        // 3. Verify persistent notification created for Supplier (not Buyer)
        List<com.synthora.notification.Notification> supplierNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(supplierUser.getId());
        assertFalse(supplierNotifications.isEmpty(), "Supplier should receive a persistent counter offer notification");

        com.synthora.notification.Notification counterNotif = supplierNotifications.get(0);
        assertEquals(com.synthora.notification.NotificationType.COUNTER_OFFER_RECEIVED, counterNotif.getType());
        assertEquals("Buyer Counter Offer Received", counterNotif.getTitle());
        assertEquals(testRfq.getId(), counterNotif.getEntityId(), "Notification entityId MUST be the RFQ UUID for navigation");
        assertEquals(com.synthora.notification.NotificationEntityType.RFQ, counterNotif.getEntityType());

        // Verify Buyer does NOT receive supplier-side counter offer notification
        List<com.synthora.notification.Notification> buyerNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(buyer.getId());
        boolean buyerReceivedCounterNotif = buyerNotifications.stream()
                .anyMatch(n -> n.getType() == com.synthora.notification.NotificationType.COUNTER_OFFER_RECEIVED);
        assertFalse(buyerReceivedCounterNotif, "Buyer must NOT receive counter offer notification sent to supplier");
    }
}
