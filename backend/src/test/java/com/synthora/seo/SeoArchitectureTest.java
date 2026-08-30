package com.synthora.seo;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.product.Product;
import com.synthora.product.ProductCategory;
import com.synthora.product.ProductRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SeoArchitectureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User supplierUser;
    private Supplier supplier;
    private Product product;
    private String productCode;

    @BeforeEach
    public void setUp() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        supplierUser = new User();
        supplierUser.setName("SEO Supplier " + suffix);
        supplierUser.setEmail("seo_supplier_" + suffix + "@test.com");
        supplierUser.setPasswordHash("hash");
        supplierUser.setRole(UserRole.SUPPLIER);
        supplierUser.setStatus(com.synthora.identity.UserStatus.ACTIVE);
        supplierUser = userRepository.save(supplierUser);

        supplier = new Supplier();
        supplier.setName("SEO Chemical Corp " + suffix);
        supplier.setSlug("seo-chemical-corp-" + suffix);
        supplier.setCountryName("India");
        supplier.setCountryCode("IN");
        supplier.setUser(supplierUser);
        supplier = supplierRepository.save(supplier);

        productCode = "API-" + suffix.toUpperCase();

        product = new Product();
        product.setName("Paracetamol SEO Grade " + suffix);
        product.setProductCode(productCode);
        product.setCasNumber("103-90-2");
        product.setCategory(ProductCategory.API);
        product.setPrice(new BigDecimal("120.00"));
        product.setStock(500);
        product.setSeller(supplierUser);
        product = productRepository.save(product);
    }

    // 1. Product Detail Accessible via Logical Product Code
    @Test
    public void test01_ProductDetailAccessibleViaLogicalProductCode() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + productCode + "/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCode").value(productCode))
                .andExpect(jsonPath("$.casNumber").value("103-90-2"));
    }

    // 2. Product Detail Accessible via UUID Fallback
    @Test
    public void test02_ProductDetailAccessibleViaUuidFallback() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + product.getId().toString() + "/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(product.getId().toString()))
                .andExpect(jsonPath("$.productCode").value(productCode));
    }

    // 3. Lowercase Product Code Normalization in Search
    @Test
    public void test03_LowercaseProductCodeSearchNormalization() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + productCode.toLowerCase() + "/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCode").value(productCode));
    }

    // 4. Public Supplier Directory Includes Verified Supplier
    @Test
    public void test04_PublicSupplierDirectorySearch() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers")
                .param("search", supplier.getName()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value(supplier.getName()));
    }

    // 5. Public Supplier Profile Detail
    @Test
    public void test05_PublicSupplierProfileDetail() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(supplier.getName()));
    }
}
