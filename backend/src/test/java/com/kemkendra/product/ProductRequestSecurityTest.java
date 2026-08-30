package com.kemkendra.product;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.CreateProductRequestRequest;
import com.kemkendra.product.dto.MasterProductResponse;
import com.kemkendra.product.dto.ProductRequestResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProductRequestSecurityTest {

    @Autowired
    private ProductRequestService productRequestService;

    @Autowired
    private MasterProductService masterProductService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication authA;

    private User supplierUserB;
    private Supplier supplierB;
    private Authentication authB;

    private User buyerUser;
    private Authentication buyerAuth;

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        supplierUserA = new User();
        supplierUserA.setName("Req Supplier A " + suffix);
        supplierUserA.setEmail("req_sup_a_" + suffix + "@test.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Req Supplier A Corp " + suffix);
        supplierA.setSlug("req-sup-a-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);

        authA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null);

        supplierUserB = new User();
        supplierUserB.setName("Req Supplier B " + suffix);
        supplierUserB.setEmail("req_sup_b_" + suffix + "@test.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Req Supplier B Ltd " + suffix);
        supplierB.setSlug("req-sup-b-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);

        authB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null);

        buyerUser = new User();
        buyerUser.setName("Req Buyer " + suffix);
        buyerUser.setEmail("req_buyer_" + suffix + "@test.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);

        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null);
    }

    // 1. Supplier Can Create ProductRequest (PENDING_REVIEW)
    @Test
    public void test01_SupplierCanCreateProductRequest() {
        CreateProductRequestRequest req = new CreateProductRequestRequest(
                "Sodium Valproate Tech",
                "1069-66-5",
                "C8H15NaO2",
                ProductCategory.API,
                "Sodium Valproate technical specs",
                "Requesting addition to catalog"
        );

        ProductRequestResponse response = productRequestService.createRequest(req, authA);

        assertNotNull(response.id());
        assertEquals("PENDING_REVIEW", response.status());
        assertEquals("Sodium Valproate Tech", response.proposedName());
        assertEquals(supplierA.getId(), response.supplierId());
    }

    // 2. Request Creation Does NOT Immediately Create MasterProduct
    @Test
    public void test02_RequestCreationDoesNotCreateMasterProduct() {
        CreateProductRequestRequest req = new CreateProductRequestRequest(
                "Novel Compound X",
                "9999-99-9",
                "C10H20O2",
                ProductCategory.API,
                "Novel compound",
                "Please add to catalog"
        );

        productRequestService.createRequest(req, authA);

        List<MasterProductResponse> casResults = masterProductService.getMasterProductsByCas("9999-99-9");
        assertTrue(casResults.isEmpty());
    }

    // 3. Supplier Can View Own Requests
    @Test
    public void test03_SupplierCanViewOwnRequests() {
        productRequestService.createRequest(new CreateProductRequestRequest(
                "Compound A",
                "1111-11-1",
                "C1H1O1",
                ProductCategory.API,
                "Description",
                "Message"
        ), authA);

        List<ProductRequestResponse> myRequests = productRequestService.getMyRequests(authA);
        assertFalse(myRequests.isEmpty());
        assertEquals("Compound A", myRequests.get(0).proposedName());
    }

    // 4. Cross-Supplier Request Access Prevention
    @Test
    public void test04_CrossSupplierRequestAccessDenied() {
        ProductRequestResponse reqA = productRequestService.createRequest(new CreateProductRequestRequest(
                "Compound Private",
                "2222-22-2",
                "C2H2O2",
                ProductCategory.API,
                "Description",
                "Message"
        ), authA);

        // Supplier B attempting to view Supplier A's request must fail
        assertThrows(AccessDeniedException.class, () -> productRequestService.getRequestById(reqA.id(), authB));
    }

    // 5. Non-Supplier (Buyer) Denial
    @Test
    public void test05_BuyerCannotCreateOrViewRequests() {
        CreateProductRequestRequest req = new CreateProductRequestRequest(
                "Buyer Proposed",
                "3333-33-3",
                "C3H3O3",
                ProductCategory.API,
                "Description",
                "Message"
        );

        assertThrows(IllegalStateException.class, () -> productRequestService.createRequest(req, buyerAuth));
    }
}
