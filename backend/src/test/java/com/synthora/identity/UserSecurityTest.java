package com.synthora.identity;

import com.synthora.SynthoraApplication;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SynthoraApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.synthora.order.PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private com.synthora.rfq.quotation.QuotationRepository quotationRepository;

    @Autowired
    private com.synthora.rfq.RfqRepository rfqRepository;

    @Autowired
    private com.synthora.product.ProductRepository productRepository;

    @Autowired
    private com.synthora.product.SupplierRepository supplierRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private com.synthora.order.ShipmentRepository shipmentRepository;

    private User adminUser;
    private String adminToken;

    private User buyerUser;
    private String buyerToken;

    private User supplierUser;
    private String supplierToken;

    @BeforeEach
    public void setup() {
        shipmentRepository.deleteAll();
        purchaseOrderRepository.deleteAll();
        quotationRepository.deleteAll();
        rfqRepository.deleteAll();
        productRepository.deleteAll();
        supplierRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = new User();
        adminUser.setEmail("admin@synthora.com");
        adminUser.setName("Admin User");
        adminUser.setPasswordHash("hash123");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        buyerUser = new User();
        buyerUser.setEmail("buyer@synthora.com");
        buyerUser.setName("Buyer User");
        buyerUser.setPasswordHash("hash123");
        buyerUser.setRole(UserRole.USER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerUser = userRepository.save(buyerUser);
        buyerToken = jwtService.generateToken(buyerUser);

        supplierUser = new User();
        supplierUser.setEmail("supplier@synthora.com");
        supplierUser.setName("Supplier User");
        supplierUser.setPasswordHash("hash123");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);
        supplierToken = jwtService.generateToken(supplierUser);
    }

    @Test
    public void testAdminCanListAllUsers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    public void testAdminCanGetUserById() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + buyerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(buyerUser.getId().toString()))
                .andExpect(jsonPath("$.email").value("buyer@synthora.com"));
    }

    @Test
    public void testBuyerCannotListAllUsers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testBuyerCannotGetUserById() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testSupplierCannotListAllUsers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testSupplierCannotGetUserById() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + buyerUser.getId())
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testAuthenticatedUsersCanAccessUsersMe() throws Exception {
        // Buyer accessing /users/me
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("buyer@synthora.com"));

        // Supplier accessing /users/me
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("supplier@synthora.com"));

        // Admin accessing /users/me
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@synthora.com"));
    }

    @Test
    public void testUnauthenticatedCannotAccessProtectedEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/users/" + buyerUser.getId()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isForbidden());
    }
}
