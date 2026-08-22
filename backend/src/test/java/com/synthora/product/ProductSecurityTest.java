package com.synthora.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.dto.CreateProductRequest;
import com.synthora.product.dto.UpdateProductRequest;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProductSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User buyer;
    private String buyerToken;

    private User supplier1;
    private String supplier1Token;

    private User supplier2;
    private String supplier2Token;

    private User admin;
    private String adminToken;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        buyer = new User();
        buyer.setEmail("buyer@synthora.com");
        buyer.setName("Buyer");
        buyer.setPasswordHash("hash123");
        buyer.setRole(UserRole.USER);
        buyer = userRepository.save(buyer);
        buyerToken = jwtService.generateToken(buyer);

        supplier1 = new User();
        supplier1.setEmail("supplier1@synthora.com");
        supplier1.setName("Supplier 1");
        supplier1.setPasswordHash("hash123");
        supplier1.setRole(UserRole.SUPPLIER);
        supplier1 = userRepository.save(supplier1);
        supplier1Token = jwtService.generateToken(supplier1);

        supplier2 = new User();
        supplier2.setEmail("supplier2@synthora.com");
        supplier2.setName("Supplier 2");
        supplier2.setPasswordHash("hash123");
        supplier2.setRole(UserRole.SUPPLIER);
        supplier2 = userRepository.save(supplier2);
        supplier2Token = jwtService.generateToken(supplier2);

        admin = new User();
        admin.setEmail("admin@synthora.com");
        admin.setName("Admin");
        admin.setPasswordHash("hash123");
        admin.setRole(UserRole.ADMIN);
        admin = userRepository.save(admin);
        adminToken = jwtService.generateToken(admin);
    }

    @Test
    public void testSupplierCanCreateProduct() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                "Ibuprofen API",
                "High purity Ibuprofen API",
                new BigDecimal("45.50"),
                ProductCategory.API,
                1000,
                "15687-27-1",
                "C13H18O2",
                new BigDecimal("99.5"),
                "USP Grade",
                new BigDecimal("25.0"),
                "25kg Fiber Drum",
                14,
                true,
                true,
                true,
                "IN_STOCK"
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + supplier1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Ibuprofen API")))
                .andExpect(jsonPath("$.sellerId", is(supplier1.getId().toString())));

        assertEquals(1, productRepository.count());
        Product p = productRepository.findAll().get(0);
        assertEquals(supplier1.getId(), p.getSeller().getId());
        assertEquals("15687-27-1", p.getCasNumber());
        assertEquals("USP Grade", p.getGrade());
        assertTrue(p.getCoaAvailable());
    }

    @Test
    public void testBuyerCannotCreateProduct() throws Exception {
        CreateProductRequest request = new CreateProductRequest(
                "Ibuprofen API", "Desc", new BigDecimal("45.50"), ProductCategory.API, 100, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testSupplierCanRetrieveOwnProducts() throws Exception {
        createTestProduct("S1 Product A", supplier1);
        createTestProduct("S1 Product B", supplier1);
        createTestProduct("S2 Product", supplier2);

        mockMvc.perform(get("/api/v1/products/my")
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name", anyOf(is("S1 Product A"), is("S1 Product B"))));
    }

    @Test
    public void testSupplierCannotRetrieveAnotherSuppliersProductsViaMy() throws Exception {
        createTestProduct("S1 Product A", supplier1);

        mockMvc.perform(get("/api/v1/products/my")
                        .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    public void testSupplierCanUpdateOwnProduct() throws Exception {
        Product p = createTestProduct("Old Name", supplier1);

        UpdateProductRequest update = new UpdateProductRequest(
                "New Name", "Desc", new BigDecimal("50.00"), ProductCategory.EXCIPIENT, 200, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/products/" + p.getId())
                        .header("Authorization", "Bearer " + supplier1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("New Name")));
    }

    @Test
    public void testSupplierCannotUpdateAnotherSuppliersProduct() throws Exception {
        Product p = createTestProduct("S1 Product", supplier1);

        UpdateProductRequest update = new UpdateProductRequest(
                "Hacked Name", "Desc", new BigDecimal("50.00"), ProductCategory.EXCIPIENT, 200, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/products/" + p.getId())
                        .header("Authorization", "Bearer " + supplier2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());

        Product reloaded = productRepository.findById(p.getId()).get();
        assertEquals("S1 Product", reloaded.getName(), "Product should not be updated");
    }

    @Test
    public void testSupplierCanDeleteOwnProduct() throws Exception {
        Product p = createTestProduct("S1 Product", supplier1);

        mockMvc.perform(delete("/api/v1/products/" + p.getId())
                        .header("Authorization", "Bearer " + supplier1Token))
                .andExpect(status().isNoContent());

        assertEquals(0, productRepository.count());
    }

    @Test
    public void testSupplierCannotDeleteAnotherSuppliersProduct() throws Exception {
        Product p = createTestProduct("S1 Product", supplier1);

        mockMvc.perform(delete("/api/v1/products/" + p.getId())
                        .header("Authorization", "Bearer " + supplier2Token))
                .andExpect(status().isForbidden());

        assertEquals(1, productRepository.count());
    }
    
    @Test
    public void testAdminCanUpdateAnyProduct() throws Exception {
        Product p = createTestProduct("S1 Product", supplier1);

        UpdateProductRequest update = new UpdateProductRequest(
                "Admin Updated", "Desc", new BigDecimal("50.00"), ProductCategory.EXCIPIENT, 200, null, null, null, null, null, null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/products/" + p.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk());
    }
    
    @Test
    public void testAdminCanDeleteAnyProduct() throws Exception {
        Product p = createTestProduct("S1 Product", supplier1);

        mockMvc.perform(delete("/api/v1/products/" + p.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertEquals(0, productRepository.count());
    }

    private Product createTestProduct(String name, User owner) {
        Product product = new Product();
        product.setName(name);
        product.setDescription("Test Desc");
        product.setPrice(new BigDecimal("10.00"));
        product.setStock(100);
        product.setCategory(ProductCategory.API);
        product.setSeller(owner);
        return productRepository.save(product);
    }
}
