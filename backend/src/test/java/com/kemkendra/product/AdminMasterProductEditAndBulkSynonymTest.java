package com.kemkendra.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.BulkAddSynonymsPayload;
import com.kemkendra.product.dto.UpdateMasterProductPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminMasterProductEditAndBulkSynonymTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private ProductSynonymRepository productSynonymRepository;

    @Autowired
    private UserRepository userRepository;

    private MasterProduct testProduct;
    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findByEmail("admin.edit.test@kemkendra.com").orElseGet(() -> {
            User user = new User();
            user.setId(UUID.randomUUID());
            user.setName("Admin Tester");
            user.setEmail("admin.edit.test@kemkendra.com");
            user.setPasswordHash("hashed_pw");
            user.setRole(UserRole.ADMIN);
            return userRepository.save(user);
        });

        testProduct = new MasterProduct();
        testProduct.setMasterProductCode("TEST-EDIT-001");
        testProduct.setName("Original Chemical Name");
        testProduct.setCasNumber("103-90-2");
        testProduct.setMolecularFormula("C8H9NO2");
        testProduct.setCategory(ProductCategory.API);
        testProduct.setDescription("Initial description");
        testProduct.setStatus("ACTIVE");
        testProduct = masterProductRepository.save(testProduct);
    }

    @Test
    @WithMockUser(username = "admin.edit.test@kemkendra.com", roles = {"ADMIN"})
    @DisplayName("Admin can edit existing master product and preserve identity without duplicate")
    void testUpdateMasterProduct() throws Exception {
        UUID originalId = testProduct.getId();
        long initialCount = masterProductRepository.count();

        UpdateMasterProductPayload payload = new UpdateMasterProductPayload(
                "Updated Chemical Name",
                "103-90-2",
                "C8H9NO2-MOD",
                ProductCategory.API,
                "Updated technical specifications",
                "ACTIVE",
                "Administrative correction of formula"
        );

        mockMvc.perform(put("/api/v1/admin/catalog/master-products/" + originalId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(originalId.toString()))
                .andExpect(jsonPath("$.name").value("Updated Chemical Name"))
                .andExpect(jsonPath("$.molecularFormula").value("C8H9NO2-MOD"))
                .andExpect(jsonPath("$.description").value("Updated technical specifications"));

        // Verify database state: no duplicates, ID unchanged
        assertEquals(initialCount, masterProductRepository.count());
        MasterProduct updated = masterProductRepository.findById(originalId).orElseThrow();
        assertEquals("Updated Chemical Name", updated.getName());
        assertEquals("C8H9NO2-MOD", updated.getMolecularFormula());
        assertEquals("TEST-EDIT-001", updated.getMasterProductCode());
    }

    @Test
    @WithMockUser(username = "admin.edit.test@kemkendra.com", roles = {"ADMIN"})
    @DisplayName("Admin can bulk add synonyms with deduplication and trimming")
    void testBulkAddSynonyms() throws Exception {
        BulkAddSynonymsPayload payload = new BulkAddSynonymsPayload(List.of(
                "  4-Carbazolol  ",
                "4-Hydroxy Carbazole",
                "4-hydroxy carbazole", // duplicate in different casing
                "4-Hydroxy-9H-carbazole",
                "9H-Carbazol-4-ol",
                "   " // blank should be ignored
        ));

        mockMvc.perform(post("/api/v1/admin/catalog/master-products/" + testProduct.getId() + "/synonyms/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.addedCount").value(4))
                .andExpect(jsonPath("$.allSynonyms", hasSize(4)));

        List<ProductSynonym> synonyms = productSynonymRepository.findByMasterProductId(testProduct.getId());
        assertEquals(4, synonyms.size());

        // Submitting same batch again should skip duplicates
        mockMvc.perform(post("/api/v1/admin/catalog/master-products/" + testProduct.getId() + "/synonyms/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.addedCount").value(0))
                .andExpect(jsonPath("$.skippedCount").value(4));
    }

    @Test
    @WithMockUser(username = "admin.edit.test@kemkendra.com", roles = {"ADMIN"})
    @DisplayName("Admin can delete synonym from master product")
    void testDeleteSynonym() throws Exception {
        ProductSynonym syn = new ProductSynonym(testProduct, "Temporary Synonym", SynonymSource.OFFICIAL, adminUser);
        syn = productSynonymRepository.save(syn);

        mockMvc.perform(delete("/api/v1/admin/catalog/master-products/" + testProduct.getId() + "/synonyms/" + syn.getId()))
                .andExpect(status().isNoContent());

        assertTrue(productSynonymRepository.findById(syn.getId()).isEmpty());
    }

    @Test
    @WithMockUser(username = "regular.buyer@kemkendra.com", roles = {"USER"})
    @DisplayName("Non-admin user cannot edit master product or bulk add synonyms")
    void testUnauthorizedAccessBlocked() throws Exception {
        UpdateMasterProductPayload payload = new UpdateMasterProductPayload(
                "Hacked Name", null, null, ProductCategory.API, null, null, null
        );

        mockMvc.perform(put("/api/v1/admin/catalog/master-products/" + testProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden());

        BulkAddSynonymsPayload bulkPayload = new BulkAddSynonymsPayload(List.of("Synonym 1"));
        mockMvc.perform(post("/api/v1/admin/catalog/master-products/" + testProduct.getId() + "/synonyms/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkPayload)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin.edit.test@kemkendra.com", roles = {"ADMIN"})
    @DisplayName("Admin can fetch master product details by UUID")
    void testAdminGetMasterProductDetailByUuid() throws Exception {
        mockMvc.perform(get("/api/v1/admin/catalog/master-products/" + testProduct.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testProduct.getId().toString()))
                .andExpect(jsonPath("$.name").value(testProduct.getName()))
                .andExpect(jsonPath("$.masterProductCode").value(testProduct.getMasterProductCode()))
                .andExpect(jsonPath("$.casNumber").value(testProduct.getCasNumber()));
    }

    @Test
    @WithMockUser(username = "admin.edit.test@kemkendra.com", roles = {"ADMIN"})
    @DisplayName("Admin can fetch master product details by master product code")
    void testAdminGetMasterProductDetailByCode() throws Exception {
        mockMvc.perform(get("/api/v1/admin/catalog/master-products/" + testProduct.getMasterProductCode()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testProduct.getId().toString()))
                .andExpect(jsonPath("$.name").value(testProduct.getName()))
                .andExpect(jsonPath("$.masterProductCode").value(testProduct.getMasterProductCode()));
    }

    @Test
    @WithMockUser(username = "admin.edit.test@kemkendra.com", roles = {"ADMIN"})
    @DisplayName("Admin get non-existent master product returns 404")
    void testAdminGetMasterProductDetailNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/admin/catalog/master-products/" + UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));

        mockMvc.perform(get("/api/v1/admin/catalog/master-products/NON-EXISTENT-CODE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }
}
