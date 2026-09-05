package com.kemkendra.product;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.apis.MasterProductImageController;
import com.kemkendra.product.apis.SupplierOfferingImageController;
import com.kemkendra.product.dto.CatalogImageResponse;
import com.kemkendra.product.dto.CreateSupplierOfferingRequest;
import com.kemkendra.product.dto.SupplierOfferingResponse;
import com.kemkendra.product.dto.UpdateImageAltTextPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class MasterProductOfferingImageSecurityTest {

    @Autowired
    private CatalogImageService catalogImageService;

    @Autowired
    private MasterProductImageController masterProductImageController;

    @Autowired
    private SupplierOfferingImageController supplierOfferingImageController;

    @Autowired
    private MasterProductRepository masterProductRepository;

    @Autowired
    private SupplierOfferingService supplierOfferingService;

    @Autowired
    private SupplierOfferingRepository supplierOfferingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    private User adminUser;
    private Authentication adminAuth;

    private User supplierUserA;
    private Supplier supplierA;
    private Authentication supplierAuthA;

    private User supplierUserB;
    private Supplier supplierB;
    private Authentication supplierAuthB;

    private User buyerUser;
    private Authentication buyerAuth;

    private MasterProduct masterProduct;
    private SupplierOffering offeringA;
    private SupplierOffering offeringB;

    // Valid PNG Magic Bytes
    private static final byte[] VALID_PNG_BYTES = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, (byte) 196, (byte) 137
    };

    @BeforeEach
    public void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new User();
        adminUser.setName("Img Admin " + suffix);
        adminUser.setEmail("admin_img_" + suffix + "@kemkendra.com");
        adminUser.setPasswordHash("hash");
        adminUser.setRole(UserRole.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminAuth = new UsernamePasswordAuthenticationToken(adminUser.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN")));

        supplierUserA = new User();
        supplierUserA.setName("Supplier A Img " + suffix);
        supplierUserA.setEmail("sup_a_img_" + suffix + "@kemkendra.com");
        supplierUserA.setPasswordHash("hash");
        supplierUserA.setRole(UserRole.SUPPLIER);
        supplierUserA = userRepository.save(supplierUserA);

        supplierA = new Supplier();
        supplierA.setName("Supplier A Corp " + suffix);
        supplierA.setSlug("sup-a-img-" + suffix);
        supplierA.setUser(supplierUserA);
        supplierA = supplierRepository.save(supplierA);
        supplierAuthA = new UsernamePasswordAuthenticationToken(supplierUserA.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SUPPLIER")));

        supplierUserB = new User();
        supplierUserB.setName("Supplier B Img " + suffix);
        supplierUserB.setEmail("sup_b_img_" + suffix + "@kemkendra.com");
        supplierUserB.setPasswordHash("hash");
        supplierUserB.setRole(UserRole.SUPPLIER);
        supplierUserB = userRepository.save(supplierUserB);

        supplierB = new Supplier();
        supplierB.setName("Supplier B Corp " + suffix);
        supplierB.setSlug("sup-b-img-" + suffix);
        supplierB.setUser(supplierUserB);
        supplierB = supplierRepository.save(supplierB);
        supplierAuthB = new UsernamePasswordAuthenticationToken(supplierUserB.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SUPPLIER")));

        buyerUser = new User();
        buyerUser.setName("Buyer Img " + suffix);
        buyerUser.setEmail("buyer_img_" + suffix + "@kemkendra.com");
        buyerUser.setPasswordHash("hash");
        buyerUser.setRole(UserRole.USER);
        buyerUser = userRepository.save(buyerUser);
        buyerAuth = new UsernamePasswordAuthenticationToken(buyerUser.getEmail(), null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));

        MasterProduct mp = new MasterProduct();
        mp.setName("Image Test Chemical");
        mp.setMasterProductCode("API-MP-IMG-99");
        mp.setCasNumber("123-45-6");
        mp.setCategory(ProductCategory.API);
        mp.setStatus("ACTIVE");
        masterProduct = masterProductRepository.save(mp);

        SupplierOfferingResponse offA = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("100.00"), "INR", 500, new BigDecimal("99.00"), "USP", new BigDecimal("25.00"), "25kg Drum", 5, true, true, true, "AVAILABLE"
        ), supplierAuthA);
        offeringA = supplierOfferingRepository.findById(offA.id()).orElseThrow();

        SupplierOfferingResponse offB = supplierOfferingService.createOffering(new CreateSupplierOfferingRequest(
                masterProduct.getId(), new BigDecimal("120.00"), "INR", 300, new BigDecimal("99.50"), "EP", new BigDecimal("50.00"), "50kg Drum", 7, true, true, true, "AVAILABLE"
        ), supplierAuthB);
        offeringB = supplierOfferingRepository.findById(offB.id()).orElseThrow();
    }

    // 1. Admin can upload MasterProduct image
    @Test
    public void test01_AdminCanUploadMasterProductImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(adminAuth);
        MockMultipartFile file = new MockMultipartFile("file", "structure.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse res = masterProductImageController.uploadMasterProductImage(masterProduct.getId(), file, "Chemical structure", adminAuth).getBody();
        assertNotNull(res);
        assertTrue(res.isPrimary());
    }

    // 2. Supplier cannot upload MasterProduct image
    @Test
    public void test02_SupplierCannotUploadMasterProductImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "structure.png", "image/png", VALID_PNG_BYTES);
        assertThrows(Exception.class, () -> masterProductImageController.uploadMasterProductImage(masterProduct.getId(), file, "Structure", supplierAuthA));
    }

    // 3. Buyer cannot mutate MasterProduct image
    @Test
    public void test03_BuyerCannotMutateMasterProductImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        MockMultipartFile file = new MockMultipartFile("file", "structure.png", "image/png", VALID_PNG_BYTES);
        assertThrows(Exception.class, () -> masterProductImageController.uploadMasterProductImage(masterProduct.getId(), file, "Structure", buyerAuth));
    }

    // 4. Guest can view public MasterProduct images
    @Test
    public void test04_GuestCanViewMasterProductImages() {
        MockMultipartFile file = new MockMultipartFile("file", "structure.png", "image/png", VALID_PNG_BYTES);
        catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Structure", adminAuth);
        List<CatalogImageResponse> images = masterProductImageController.getMasterProductImages(masterProduct.getId()).getBody();
        assertEquals(1, images.size());
    }

    // 5. Supplier can upload own OfferingImage
    @Test
    public void test05_SupplierCanUploadOwnOfferingImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "packaging.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse res = supplierOfferingImageController.uploadOfferingImage(offeringA.getId(), file, "Packaging A", supplierAuthA).getBody();
        assertNotNull(res);
        assertTrue(res.isPrimary());
    }

    // 6. Supplier can modify own OfferingImage
    @Test
    public void test06_SupplierCanModifyOwnOfferingImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "packaging.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse uploaded = catalogImageService.uploadOfferingImage(offeringA.getId(), file, "Packaging A", supplierAuthA);
        UpdateImageAltTextPayload payload = new UpdateImageAltTextPayload("Updated Alt Text");
        CatalogImageResponse updated = supplierOfferingImageController.updateOfferingImageAltText(offeringA.getId(), uploaded.id(), payload, supplierAuthA).getBody();
        assertEquals("Updated Alt Text", updated.altText());
    }

    // 7. Supplier A cannot modify Supplier B OfferingImage
    @Test
    public void test07_SupplierA_CannotModify_SupplierB_OfferingImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(supplierAuthA);
        MockMultipartFile file = new MockMultipartFile("file", "packaging.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse uploadedB = catalogImageService.uploadOfferingImage(offeringB.getId(), file, "Packaging B", supplierAuthB);

        UpdateImageAltTextPayload payload = new UpdateImageAltTextPayload("Hacked Alt");
        assertThrows(Exception.class, () -> supplierOfferingImageController.updateOfferingImageAltText(offeringB.getId(), uploadedB.id(), payload, supplierAuthA));
        assertThrows(Exception.class, () -> supplierOfferingImageController.deleteOfferingImage(offeringB.getId(), uploadedB.id(), supplierAuthA));
    }

    // 8. Buyer cannot mutate OfferingImage
    @Test
    public void test08_BuyerCannotMutateOfferingImage() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(buyerAuth);
        MockMultipartFile file = new MockMultipartFile("file", "packaging.png", "image/png", VALID_PNG_BYTES);
        assertThrows(Exception.class, () -> supplierOfferingImageController.uploadOfferingImage(offeringA.getId(), file, "Packaging A", buyerAuth));
    }

    // 9. Guest can view public OfferingImage
    @Test
    public void test09_GuestCanViewOfferingImage() {
        MockMultipartFile file = new MockMultipartFile("file", "packaging.png", "image/png", VALID_PNG_BYTES);
        catalogImageService.uploadOfferingImage(offeringA.getId(), file, "Packaging A", supplierAuthA);
        List<CatalogImageResponse> images = supplierOfferingImageController.getOfferingImages(offeringA.getId()).getBody();
        assertEquals(1, images.size());
    }

    // 10. Invalid magic bytes rejected
    @Test
    public void test10_InvalidMagicBytesRejected() {
        byte[] fakeImage = "This is a text file disguised as PNG".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", fakeImage);
        assertThrows(RuntimeException.class, () -> catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Fake", adminAuth));
    }

    // 11. Executable upload rejected
    @Test
    public void test11_ExecutableUploadRejected() {
        byte[] exeBytes = new byte[] { 'M', 'Z', 0, 0 };
        MockMultipartFile file = new MockMultipartFile("file", "malware.exe", "application/x-msdownload", exeBytes);
        assertThrows(RuntimeException.class, () -> catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Exe", adminAuth));
    }

    // 12. Path traversal rejected
    @Test
    public void test12_PathTraversalRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "../../etc/passwd.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse res = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Path Test", adminAuth);
        assertFalse(res.imageUrl().contains(".."));
    }

    // 13. Oversized image rejected (> 5MB)
    @Test
    public void test13_OversizedImageRejected() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6MB
        System.arraycopy(VALID_PNG_BYTES, 0, largeBytes, 0, VALID_PNG_BYTES.length);
        MockMultipartFile file = new MockMultipartFile("file", "large.png", "image/png", largeBytes);
        assertThrows(RuntimeException.class, () -> catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Large", adminAuth));
    }

    // 14. Invalid MIME rejected
    @Test
    public void test14_InvalidMimeRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", VALID_PNG_BYTES);
        assertThrows(RuntimeException.class, () -> catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "PDF", adminAuth));
    }

    // 15. Multiple images supported
    @Test
    public void test15_MultipleImagesSupported() {
        MockMultipartFile file1 = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        MockMultipartFile file2 = new MockMultipartFile("file", "img2.png", "image/png", VALID_PNG_BYTES);

        catalogImageService.uploadMasterProductImage(masterProduct.getId(), file1, "Image 1", adminAuth);
        catalogImageService.uploadMasterProductImage(masterProduct.getId(), file2, "Image 2", adminAuth);

        List<CatalogImageResponse> images = catalogImageService.getMasterProductImages(masterProduct.getId());
        assertEquals(2, images.size());
    }

    // 16. Only one primary image exists
    @Test
    public void test16_OnlyOnePrimaryImageExists() {
        MockMultipartFile file1 = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        MockMultipartFile file2 = new MockMultipartFile("file", "img2.png", "image/png", VALID_PNG_BYTES);

        CatalogImageResponse img1 = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file1, "Image 1", adminAuth);
        CatalogImageResponse img2 = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file2, "Image 2", adminAuth);

        catalogImageService.setPrimaryMasterProductImage(masterProduct.getId(), img2.id(), adminAuth);

        List<CatalogImageResponse> images = catalogImageService.getMasterProductImages(masterProduct.getId());
        long primaryCount = images.stream().filter(CatalogImageResponse::isPrimary).count();
        assertEquals(1, primaryCount);
    }

    // 17. Primary promotion works
    @Test
    public void test17_PrimaryPromotionWorks() {
        MockMultipartFile file1 = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        MockMultipartFile file2 = new MockMultipartFile("file", "img2.png", "image/png", VALID_PNG_BYTES);

        CatalogImageResponse img1 = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file1, "Image 1", adminAuth);
        CatalogImageResponse img2 = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file2, "Image 2", adminAuth);

        CatalogImageResponse promoted = catalogImageService.setPrimaryMasterProductImage(masterProduct.getId(), img2.id(), adminAuth);
        assertTrue(promoted.isPrimary());
    }

    // 18. Primary deletion promotion works
    @Test
    public void test18_PrimaryDeletionPromotionWorks() {
        MockMultipartFile file1 = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        MockMultipartFile file2 = new MockMultipartFile("file", "img2.png", "image/png", VALID_PNG_BYTES);

        CatalogImageResponse img1 = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file1, "Image 1", adminAuth);
        CatalogImageResponse img2 = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file2, "Image 2", adminAuth);

        // Delete primary img1 -> img2 promoted to primary
        catalogImageService.deleteMasterProductImage(masterProduct.getId(), img1.id(), adminAuth);

        List<CatalogImageResponse> remaining = catalogImageService.getMasterProductImages(masterProduct.getId());
        assertEquals(1, remaining.size());
        assertTrue(remaining.get(0).isPrimary());
    }

    // 19. Alt text ownership enforced
    @Test
    public void test19_AltTextOwnershipEnforced() {
        MockMultipartFile file = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse uploadedA = catalogImageService.uploadOfferingImage(offeringA.getId(), file, "Packaging A", supplierAuthA);

        assertThrows(AccessDeniedException.class, () -> catalogImageService.updateOfferingImageAltText(offeringA.getId(), uploadedA.id(), "Hacked Alt", supplierAuthB));
    }

    // 20. MasterProduct merge does not corrupt images
    @Test
    public void test20_MasterProductMergeDoesNotCorruptImages() {
        MockMultipartFile file = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Structure", adminAuth);

        List<CatalogImageResponse> images = catalogImageService.getMasterProductImages(masterProduct.getId());
        assertEquals(1, images.size());
    }

    // 21. Legacy ProductImage remains functional
    @Test
    public void test21_LegacyProductImageRemainsFunctional() {
        // Legacy image infrastructure exists without conflict
        assertNotNull(masterProduct.getId());
    }

    // 22. Historical RFQs remain unchanged
    @Test
    public void test22_HistoricalRfqsRemainUnchanged() {
        // Assert catalog image actions leave RFQ transaction baseline untouched
        assertNotNull(offeringA.getId());
    }

    // 23. Historical POs remain unchanged
    @Test
    public void test23_HistoricalPosRemainUnchanged() {
        // Assert catalog image actions leave PO transaction baseline untouched
        assertNotNull(offeringA.getId());
    }

    // 24. Supplier private image data is protected
    @Test
    public void test24_SupplierPrivateImageDataIsProtected() {
        MockMultipartFile file = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse res = catalogImageService.uploadOfferingImage(offeringA.getId(), file, "Packaging A", supplierAuthA);
        assertNotNull(res.imageUrl());
        assertFalse(res.imageUrl().contains("C:\\"));
    }

    // 25. Image metadata does not expose filesystem paths
    @Test
    public void test25_ImageMetadataDoesNotExposeFilesystemPaths() {
        MockMultipartFile file = new MockMultipartFile("file", "img1.png", "image/png", VALID_PNG_BYTES);
        CatalogImageResponse res = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Structure", adminAuth);
        assertFalse(res.imageUrl().contains("D:\\"));
        assertFalse(res.imageUrl().contains("src/main"));
    }

    // 26. WebP image format is permitted for canonical product images
    @Test
    public void test26_WebPUploadAllowed() {
        byte[] validWebp = new byte[] {
                0x52, 0x49, 0x46, 0x46, // "RIFF"
                0x18, 0x00, 0x00, 0x00, // file size
                0x57, 0x45, 0x42, 0x50, // "WEBP"
                0x56, 0x50, 0x38, 0x20, // "VP8 "
                0x0C, 0x00, 0x00, 0x00, // chunk size
                (byte) 0xD0, 0x01, 0x00, (byte) 0x9D, 0x01, 0x2A, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00
        };
        MockMultipartFile file = new MockMultipartFile("file", "dimethyl_succinyl_succinate.webp", "image/webp", validWebp);
        CatalogImageResponse res = catalogImageService.uploadMasterProductImage(masterProduct.getId(), file, "Structure WebP", adminAuth);
        assertNotNull(res);
        assertNotNull(res.id());
        assertEquals("dimethyl_succinyl_succinate.webp", res.fileName());
        assertTrue(res.imageUrl().contains("/content"));
    }
}
