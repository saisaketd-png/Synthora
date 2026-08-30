package com.kemkendra.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class CatalogSearchAndProductCodeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private User activeSupplier;
    private User suspendedSupplier;
    private Product productApi1;
    private Product productSolvent1;
    private Product productIntermediate1;
    private Product hiddenProduct;
    private Product suspendedSupplierProduct;

    @BeforeEach
    void setupTestData() {
        productRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        activeSupplier = userRepository.save(new User(
                UUID.randomUUID(),
                "Active Supplier " + suffix,
                "supplier_" + suffix + "@chemcorp.com",
                "1234567890",
                "hashedpwd",
                UserRole.SUPPLIER,
                UserStatus.ACTIVE
        ));

        suspendedSupplier = userRepository.save(new User(
                UUID.randomUUID(),
                "Suspended Supplier " + suffix,
                "badsupplier_" + suffix + "@chemcorp.com",
                "9876543210",
                "hashedpwd",
                UserRole.SUPPLIER,
                UserStatus.SUSPENDED
        ));

        // Product 1: API (Paracetamol)
        productApi1 = new Product();
        productApi1.setSeller(activeSupplier);
        productApi1.setName("Paracetamol (Acetaminophen) Micronized");
        productApi1.setProductCode("API-100428");
        productApi1.setCategory(ProductCategory.API);
        productApi1.setDescription("Pharmaceutical active ingredient for analgesics and antipyretics.");
        productApi1.setCasNumber("103-90-2");
        productApi1.setMolecularFormula("C8H9NO2");
        productApi1.setPurity(new BigDecimal("99.80"));
        productApi1.setGrade("USP / EP");
        productApi1.setPrice(new BigDecimal("18.50"));
        productApi1.setStock(5000);
        productApi1.setMoqKg(new BigDecimal("100.00"));
        productApi1.setPackaging("25kg Fiber Drum");
        productApi1.setLeadTimeDays(3);
        productApi1.setCoaAvailable(true);
        productApi1.setMsdsAvailable(true);
        productApi1.setExportReady(true);
        productApi1.setAvailabilityStatus("IN_STOCK");
        productRepository.save(productApi1);

        // Product 2: Solvent (Dimethylformamide)
        productSolvent1 = new Product();
        productSolvent1.setSeller(activeSupplier);
        productSolvent1.setName("N,N-Dimethylformamide (DMF) HPLC Grade");
        productSolvent1.setProductCode("SOL-294819");
        productSolvent1.setCategory(ProductCategory.SOLVENT);
        productSolvent1.setDescription("High purity organic solvent for peptide synthesis and chemical reactions.");
        productSolvent1.setCasNumber("68-12-2");
        productSolvent1.setMolecularFormula("C3H7NO");
        productSolvent1.setPurity(new BigDecimal("99.90"));
        productSolvent1.setGrade("HPLC Grade");
        productSolvent1.setPrice(new BigDecimal("12.00"));
        productSolvent1.setStock(12000);
        productSolvent1.setMoqKg(new BigDecimal("500.00"));
        productSolvent1.setPackaging("200L Steel Drum");
        productSolvent1.setLeadTimeDays(7);
        productSolvent1.setCoaAvailable(true);
        productSolvent1.setMsdsAvailable(true);
        productSolvent1.setExportReady(false);
        productSolvent1.setAvailabilityStatus("IN_STOCK");
        productRepository.save(productSolvent1);

        // Product 3: Intermediate (4-Hydroxycarbazole)
        productIntermediate1 = new Product();
        productIntermediate1.setSeller(activeSupplier);
        productIntermediate1.setName("4-Hydroxycarbazole Pure");
        productIntermediate1.setProductCode("INT-829103");
        productIntermediate1.setCategory(ProductCategory.INTERMEDIATE);
        productIntermediate1.setDescription("Key precursor for Carvedilol antihypertensive synthesis.");
        productIntermediate1.setCasNumber("5263-87-6");
        productIntermediate1.setMolecularFormula("C12H9NO");
        productIntermediate1.setPurity(new BigDecimal("98.50"));
        productIntermediate1.setGrade("Technical Grade");
        productIntermediate1.setPrice(new BigDecimal("95.00"));
        productIntermediate1.setStock(0);
        productIntermediate1.setMoqKg(new BigDecimal("25.00"));
        productIntermediate1.setPackaging("10kg Fiber Drum");
        productIntermediate1.setLeadTimeDays(14);
        productIntermediate1.setCoaAvailable(false);
        productIntermediate1.setMsdsAvailable(true);
        productIntermediate1.setExportReady(true);
        productIntermediate1.setAvailabilityStatus("MADE_TO_ORDER");
        productRepository.save(productIntermediate1);

        // Product 4: Hidden/Discontinued product
        hiddenProduct = new Product();
        hiddenProduct.setSeller(activeSupplier);
        hiddenProduct.setName("Discontinued Chemical Compound");
        hiddenProduct.setProductCode("SPC-999999");
        hiddenProduct.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        hiddenProduct.setDescription("Archived catalog item");
        hiddenProduct.setCasNumber("999-99-9");
        hiddenProduct.setPrice(new BigDecimal("10.00"));
        hiddenProduct.setStock(0);
        hiddenProduct.setAvailabilityStatus("DISCONTINUED");
        productRepository.save(hiddenProduct);

        // Product 5: Product from suspended seller
        suspendedSupplierProduct = new Product();
        suspendedSupplierProduct.setSeller(suspendedSupplier);
        suspendedSupplierProduct.setName("Illicit Chemical Agent");
        suspendedSupplierProduct.setProductCode("SPC-000001");
        suspendedSupplierProduct.setCategory(ProductCategory.SPECIALTY_CHEMICAL);
        suspendedSupplierProduct.setDescription("Banned compound from suspended seller");
        suspendedSupplierProduct.setCasNumber("000-00-0");
        suspendedSupplierProduct.setPrice(new BigDecimal("500.00"));
        suspendedSupplierProduct.setStock(10);
        suspendedSupplierProduct.setAvailabilityStatus("IN_STOCK");
        productRepository.save(suspendedSupplierProduct);
    }

    // =========================================================================
    // 1. CATALOG SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("Empty search returns all active public products and excludes hidden/suspended")
    void testEmptySearchReturnsActivePublicProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].productCode", hasItems("API-100428", "SOL-294819", "INT-829103")))
                .andExpect(jsonPath("$.content[*].productCode", not(hasItem("SPC-999999"))))
                .andExpect(jsonPath("$.content[*].productCode", not(hasItem("SPC-000001"))));
    }

    @Test
    @DisplayName("Search by product name keyword finds matching products")
    void testSearchByProductName() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "Paracetamol"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("API-100428")))
                .andExpect(jsonPath("$.content[0].name", containsString("Paracetamol")));
    }

    @Test
    @DisplayName("Search by exact product code returns matching product")
    void testSearchByProductCode() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "API-100428"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].name", containsString("Paracetamol")));
    }

    @Test
    @DisplayName("Search by CAS number returns matching product")
    void testSearchByCasNumber() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "68-12-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("SOL-294819")));
    }

    @Test
    @DisplayName("Search by molecular formula returns matching product")
    void testSearchByMolecularFormula() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "C12H9NO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("INT-829103")));
    }

    @Test
    @DisplayName("Search is case-insensitive and trims leading/trailing whitespace")
    void testSearchCaseInsensitiveAndTrimmed() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "   hydroxycarbazole   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("INT-829103")));
    }

    @Test
    @DisplayName("Search handles chemical notation and hyphens safely without false matches")
    void testSearchChemicalHyphenation() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "N,N-Dimethylformamide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("SOL-294819")));
    }

    // =========================================================================
    // 2. CATEGORY & MULTI-FILTER TESTS
    // =========================================================================

    @Test
    @DisplayName("Exact category filter returns only products in that category")
    void testCategoryFilterExact() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("category", "API"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("API-100428")));
    }

    @Test
    @DisplayName("Multi-category filter returns products in any of the specified categories")
    void testMultiCategoryFilter() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("category", "API,INTERMEDIATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.content[*].productCode", containsInAnyOrder("API-100428", "INT-829103")));
    }

    @Test
    @DisplayName("Multi-filter uses strict AND conjunction (Category + Search + InStock)")
    void testMultiFilterAndConjunction() throws Exception {
        // Search "carbazole" in INTERMEDIATE category with inStock=true (Stock is 0, so should return 0)
        mockMvc.perform(get("/api/v1/products")
                        .param("search", "carbazole")
                        .param("category", "INTERMEDIATE")
                        .param("inStock", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(0)));

        // Without inStock filter, should return 1
        mockMvc.perform(get("/api/v1/products")
                        .param("search", "carbazole")
                        .param("category", "INTERMEDIATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].productCode", is("INT-829103")));
    }

    @Test
    @DisplayName("Purity range filter returns products within range")
    void testPurityFilter() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("purityMin", "99.00")
                        .param("purityMax", "100.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.content[*].productCode", containsInAnyOrder("API-100428", "SOL-294819")));
    }

    @Test
    @DisplayName("Quality documentation filter returns COA available products")
    void testDocumentationFilter() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("coa", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.content[*].productCode", containsInAnyOrder("API-100428", "SOL-294819")));
    }

    // =========================================================================
    // 3. SECURITY & INJECTION RESISTANCE TESTS
    // =========================================================================

    @Test
    @DisplayName("SQL injection attempts in search parameter are treated as literal text safely")
    void testSqlInjectionInSearchTreatedSafely() throws Exception {
        mockMvc.perform(get("/api/v1/products").param("search", "' OR 1=1 --"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    @DisplayName("Sort parameter allows safe sort fields and defaults safely on invalid fields")
    void testSortAllowlisting() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("sortField", "productCode")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].productCode", is("API-100428")));

        // Malicious sortField injection falls back to default createdAt DESC
        mockMvc.perform(get("/api/v1/products")
                        .param("sortField", "password_hash; DROP TABLE users;--")
                        .param("sortDir", "asc"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 4. PRODUCT DETAIL & CODE ROUTING TESTS
    // =========================================================================

    @Test
    @DisplayName("Product detail can be fetched by logical product code")
    void testGetProductDetailByProductCode() throws Exception {
        mockMvc.perform(get("/api/v1/products/API-100428/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(productApi1.getId().toString())))
                .andExpect(jsonPath("$.productCode", is("API-100428")))
                .andExpect(jsonPath("$.name", containsString("Paracetamol")))
                .andExpect(jsonPath("$.casNumber", is("103-90-2")))
                .andExpect(jsonPath("$.molecularFormula", is("C8H9NO2")))
                .andExpect(jsonPath("$.purity", is(99.80)));
    }

    @Test
    @DisplayName("Product detail can be fetched by lowercase product code")
    void testGetProductDetailByLowercaseProductCode() throws Exception {
        mockMvc.perform(get("/api/v1/products/api-100428/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productCode", is("API-100428")));
    }

    @Test
    @DisplayName("Product detail can be fetched by internal UUID")
    void testGetProductDetailByUuid() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + productApi1.getId() + "/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(productApi1.getId().toString())))
                .andExpect(jsonPath("$.productCode", is("API-100428")));
    }

    @Test
    @DisplayName("Non-existent product code returns 404 Not Found")
    void testNonExistentProductCodeReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/products/NON-EXISTENT-999/detail"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Discontinued product detail returns 404 Not Found")
    void testDiscontinuedProductDetailReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/products/SPC-999999/detail"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Suspended supplier product detail returns 404 Not Found")
    void testSuspendedSupplierProductDetailReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/products/SPC-000001/detail"))
                .andExpect(status().isNotFound());
    }
}
