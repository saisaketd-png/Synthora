package com.synthora.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SupplierProductPublicApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Supplier supplier1;
    private Supplier supplier2;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM users;");

        User user1 = new User(
                UUID.randomUUID(),
                "Supplier 1",
                "s1@test.com",
                "123",
                "hash",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(user1);

        User user2 = new User(
                UUID.randomUUID(),
                "Supplier 2",
                "s2@test.com",
                "456",
                "hash",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        );
        userRepository.save(user2);

        supplier1 = new Supplier();
        supplier1.setUser(user1);
        supplier1.setName("Sup1 Co");
        supplier1.setSlug("sup1-co");
        supplierRepository.save(supplier1);

        supplier2 = new Supplier();
        supplier2.setUser(user2);
        supplier2.setName("Sup2 Co");
        supplier2.setSlug("sup2-co");
        supplierRepository.save(supplier2);

        Product p1 = new Product();
        p1.setSeller(user1);
        p1.setName("Product 1");
        p1.setCategory(ProductCategory.API);
        p1.setPrice(BigDecimal.TEN);
        p1.setStock(100);
        p1.setCasNumber("111-11-1");
        productRepository.save(p1);

        Product p2 = new Product();
        p2.setSeller(user2);
        p2.setName("Product 2");
        p2.setCategory(ProductCategory.SOLVENT);
        p2.setPrice(BigDecimal.ONE);
        p2.setStock(200);
        productRepository.save(p2);
    }

    @Test
    void testGetSupplierProductsSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier1.getId() + "/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void testSupplierAOnlyReceivesSupplierAProducts() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier1.getId() + "/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Product 1"));
    }

    @Test
    void testSupplierBOnlyReceivesSupplierBProducts() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier2.getId() + "/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Product 2"));
    }

    @Test
    void testSupplierWithNoProductsReturnsEmpty() throws Exception {
        Supplier supplier3 = new Supplier();
        supplier3.setName("Empty Sup");
        supplier3.setSlug("empty-sup");
        supplierRepository.save(supplier3);

        mockMvc.perform(get("/api/v1/suppliers/" + supplier3.getId() + "/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void testUnknownSupplierReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/99999/products"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testPaginationWorks() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier1.getId() + "/products?size=10&page=0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    void testPublicResponseIsSafe() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier1.getId() + "/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].casNumber").value("111-11-1"))
                .andExpect(jsonPath("$.content[0].sellerId").doesNotExist())
                .andExpect(jsonPath("$.content[0].sellerName").doesNotExist())
                .andExpect(jsonPath("$.content[0].seller").doesNotExist())
                .andExpect(jsonPath("$.content[0].user").doesNotExist())
                .andExpect(jsonPath("$.content[0].password").doesNotExist())
                .andExpect(jsonPath("$.content[0].price").doesNotExist()) // We didn't expose price in SupplierProductPublicResponse
                .andExpect(jsonPath("$.content[0].stock").doesNotExist()); // Didn't expose stock
    }

    @Test
    void testEndpointDoesNotPermitPost() throws Exception {
        mockMvc.perform(post("/api/v1/suppliers/" + supplier1.getId() + "/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testEndpointDoesNotPermitPut() throws Exception {
        mockMvc.perform(put("/api/v1/suppliers/" + supplier1.getId() + "/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testEndpointDoesNotPermitDelete() throws Exception {
        mockMvc.perform(delete("/api/v1/suppliers/" + supplier1.getId() + "/products"))
                .andExpect(status().isForbidden());
    }
}
