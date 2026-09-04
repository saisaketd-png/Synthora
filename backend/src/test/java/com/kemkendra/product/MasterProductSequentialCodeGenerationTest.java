package com.kemkendra.product;

import com.kemkendra.admin.audit.AuditLogRepository;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.dto.CreateMasterProductPayload;
import com.kemkendra.product.dto.MasterProductResponse;
import com.kemkendra.product.dto.UpdateMasterProductPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class MasterProductSequentialCodeGenerationTest {

    @Autowired
    private AdminMasterCatalogService adminMasterCatalogService;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private MasterProductCodeGenerator codeGenerator;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MasterProductCodeSequenceRepository sequenceRepository;

    private Authentication adminAuth;
    private User adminUser;

    @BeforeEach
    public void setup() {
        sequenceRepository.deleteAll();
        masterProductRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin-seq@kemkendra.com");
        adminUser.setPasswordHash("hashedpassword");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setName("Catalog Admin");
        userRepository.save(adminUser);

        adminAuth = new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    @Test
    @DisplayName("1. Generates clean sequential product codes for API category (API-00001, API-00002)")
    public void testSequentialCodesForApiCategory() {
        CreateMasterProductPayload p1 = new CreateMasterProductPayload(
                "Paracetamol Standard",
                "103-90-2",
                "C8H9NO2",
                ProductCategory.API,
                "API analgesic",
                "ACTIVE"
        );
        MasterProductResponse r1 = adminMasterCatalogService.createMasterProduct(p1, adminAuth);
        assertNotNull(r1.masterProductCode());
        assertEquals("API-00001", r1.masterProductCode());

        CreateMasterProductPayload p2 = new CreateMasterProductPayload(
                "Ibuprofen Pure",
                "15687-27-1",
                "C13H18O2",
                ProductCategory.API,
                "API anti-inflammatory",
                "ACTIVE"
        );
        MasterProductResponse r2 = adminMasterCatalogService.createMasterProduct(p2, adminAuth);
        assertNotNull(r2.masterProductCode());
        assertEquals("API-00002", r2.masterProductCode());
    }

    @Test
    @DisplayName("2. Generates correct prefixes for different chemical categories")
    public void testCategoryPrefixes() {
        CreateMasterProductPayload excPayload = new CreateMasterProductPayload(
                "Microcrystalline Cellulose",
                "9004-34-6",
                "(C6H10O5)n",
                ProductCategory.EXCIPIENT,
                "Binder and disintegrant",
                "ACTIVE"
        );
        MasterProductResponse exc = adminMasterCatalogService.createMasterProduct(excPayload, adminAuth);
        assertEquals("EXC-00001", exc.masterProductCode());

        CreateMasterProductPayload intPayload = new CreateMasterProductPayload(
                "4-Aminophenol",
                "123-30-8",
                "C6H7NO",
                ProductCategory.INTERMEDIATE,
                "Paracetamol synthesis intermediate",
                "ACTIVE"
        );
        MasterProductResponse intermediate = adminMasterCatalogService.createMasterProduct(intPayload, adminAuth);
        assertEquals("INT-00001", intermediate.masterProductCode());

        CreateMasterProductPayload solPayload = new CreateMasterProductPayload(
                "Methylene Chloride",
                "75-09-2",
                "CH2Cl2",
                ProductCategory.SOLVENT,
                "HPLC grade solvent",
                "ACTIVE"
        );
        MasterProductResponse sol = adminMasterCatalogService.createMasterProduct(solPayload, adminAuth);
        assertEquals("SOL-00001", sol.masterProductCode());

        CreateMasterProductPayload spcPayload = new CreateMasterProductPayload(
                "Titanium Dioxide Dispersion",
                "13463-67-7",
                "TiO2",
                ProductCategory.SPECIALTY_CHEMICAL,
                "Specialty coating agent",
                "ACTIVE"
        );
        MasterProductResponse spc = adminMasterCatalogService.createMasterProduct(spcPayload, adminAuth);
        assertEquals("SPC-00001", spc.masterProductCode());
    }

    @Test
    @DisplayName("3. Category change on existing product preserves original product code")
    public void testCategoryChangePreservesProductCode() {
        CreateMasterProductPayload p1 = new CreateMasterProductPayload(
                "Polyethylene Glycol 400",
                "25322-68-3",
                "H(OCH2CH2)nOH",
                ProductCategory.API,
                "Initial classified as API",
                "ACTIVE"
        );
        MasterProductResponse created = adminMasterCatalogService.createMasterProduct(p1, adminAuth);
        assertEquals("API-00001", created.masterProductCode());
        assertEquals(ProductCategory.API, created.category());

        // Now an administrator corrects the category to EXCIPIENT
        UpdateMasterProductPayload update = new UpdateMasterProductPayload(
                "Polyethylene Glycol 400",
                "25322-68-3",
                "H(OCH2CH2)nOH",
                ProductCategory.EXCIPIENT,
                "Reclassified accurately as excipient polymer",
                "ACTIVE",
                "Governance category alignment"
        );
        MasterProductResponse updated = adminMasterCatalogService.updateMasterProduct(created.id(), update, adminAuth);

        // Product code MUST remain API-00001!
        assertEquals("API-00001", updated.masterProductCode(), "Product code must remain immutable when category changes");
        assertEquals(ProductCategory.EXCIPIENT, updated.category(), "Product category must be successfully updated");
    }

    @Test
    @DisplayName("4. Concurrent product creation generates distinct, sequential codes without collision")
    public void testConcurrentCodeGeneration() throws Exception {
        int threads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        List<Future<String>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> codeGenerator.generateMasterProductCode(ProductCategory.API)));
        }

        Set<String> generatedCodes = new HashSet<>();
        for (Future<String> future : futures) {
            String code = future.get(10, TimeUnit.SECONDS);
            assertNotNull(code);
            assertTrue(code.startsWith("API-"));
            generatedCodes.add(code);
        }

        executor.shutdown();
        // All 10 codes must be completely distinct
        assertEquals(threads, generatedCodes.size(), "Each concurrent creation must receive a distinct code");
    }

    @Test
    @DisplayName("5. Scalability formatting beyond 99,999 expands to 6+ digits naturally")
    public void testScalabilityFormatting() {
        assertEquals("API-00001", codeGenerator.formatProductCode("API", 1));
        assertEquals("API-09999", codeGenerator.formatProductCode("API", 9999));
        assertEquals("API-99999", codeGenerator.formatProductCode("API", 99999));
        assertEquals("API-100000", codeGenerator.formatProductCode("API", 100000));
        assertEquals("API-100001", codeGenerator.formatProductCode("API", 100001));
        assertEquals("EXC-1234567", codeGenerator.formatProductCode("EXC", 1234567));
    }

    @Test
    @DisplayName("6. Existing legacy product codes (e.g. API-MP-XXXXXX) remain searchable and functional")
    public void testLegacyCodeSearchability() {
        MasterProduct legacy = new MasterProduct();
        legacy.setName("Legacy Chemical Product");
        legacy.setMasterProductCode("API-MP-987654");
        legacy.setCategory(ProductCategory.API);
        legacy.setStatus("ACTIVE");
        masterProductRepository.save(legacy);

        Optional<MasterProduct> foundByExact = masterProductRepository.findByMasterProductCode("API-MP-987654");
        assertTrue(foundByExact.isPresent());
        assertEquals("Legacy Chemical Product", foundByExact.get().getName());

        Optional<MasterProduct> foundByCaseInsensitive = masterProductRepository.findByMasterProductCodeIgnoreCase("api-mp-987654");
        assertTrue(foundByCaseInsensitive.isPresent());
    }
}
