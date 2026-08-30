package com.kemkendra.seller;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import com.kemkendra.identity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

@SpringBootTest
@ActiveProfiles("test")
public class SupplierIdentityReconciliationTest {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");
        
        // Setup 1: Matched (Both Supplier and SellerProfile exist)
        User matchedUser = new User();
        matchedUser.setName("Matched User");
        matchedUser.setEmail("matched@test.com");
        matchedUser.setPasswordHash("hash");
        matchedUser.setStatus(UserStatus.ACTIVE);
        matchedUser.setRole(UserRole.SUPPLIER);
        userRepository.save(matchedUser);

        Supplier matchedSupplier = new Supplier();
        matchedSupplier.setName("Matched Corp");
        matchedSupplier.setSlug("matched-corp");
        matchedSupplier.setUser(matchedUser);
        supplierRepository.save(matchedSupplier);

        SellerProfile matchedProfile = new SellerProfile();
        matchedProfile.setUser(matchedUser);
        matchedProfile.setCompanyName("Matched Corp");
        sellerProfileRepository.save(matchedProfile);

        // Setup 2: Unmatched (Supplier exists, no SellerProfile)
        User noProfileUser = new User();
        noProfileUser.setName("No Profile User");
        noProfileUser.setEmail("noprofile@test.com");
        noProfileUser.setPasswordHash("hash");
        noProfileUser.setStatus(UserStatus.ACTIVE);
        noProfileUser.setRole(UserRole.SUPPLIER);
        userRepository.save(noProfileUser);

        Supplier noProfileSupplier = new Supplier();
        noProfileSupplier.setName("No Profile Corp");
        noProfileSupplier.setSlug("no-profile-corp");
        noProfileSupplier.setUser(noProfileUser);
        supplierRepository.save(noProfileSupplier);

        // Setup 3: Unmatched (SellerProfile exists, no Supplier)
        User noSupplierUser = new User();
        noSupplierUser.setName("No Supplier User");
        noSupplierUser.setEmail("nosupplier@test.com");
        noSupplierUser.setPasswordHash("hash");
        noSupplierUser.setStatus(UserStatus.ACTIVE);
        noSupplierUser.setRole(UserRole.SUPPLIER);
        userRepository.save(noSupplierUser);

        SellerProfile noSupplierProfile = new SellerProfile();
        noSupplierProfile.setUser(noSupplierUser);
        noSupplierProfile.setCompanyName("No Supplier Corp");
        sellerProfileRepository.save(noSupplierProfile);
    }

    @Test
    @Transactional
    public void performDataConsistencyAnalysis() {
        System.out.println("============================================================");
        System.out.println("PHASE 2E.2-B: DATA CONSISTENCY ANALYSIS REPORT (TEST DATA)");
        System.out.println("============================================================");

        List<Supplier> allSuppliers = supplierRepository.findAll();
        List<SellerProfile> allProfiles = sellerProfileRepository.findAll();

        int totalSuppliers = allSuppliers.size();
        int totalProfiles = allProfiles.size();
        
        int matched = 0;
        int noProfile = 0;
        int noSupplier = 0;
        int inconsistent = 0;

        for (Supplier s : allSuppliers) {
            Optional<SellerProfile> pOpt = sellerProfileRepository.findByUser(s.getUser());
            if (pOpt.isPresent()) {
                matched++;
                if (!s.getName().equals(pOpt.get().getCompanyName())) {
                    inconsistent++;
                }
            } else {
                noProfile++;
            }
        }

        for (SellerProfile p : allProfiles) {
            Optional<Supplier> sOpt = supplierRepository.findByUser(p.getUser());
            if (sOpt.isEmpty()) {
                noSupplier++;
            }
        }

        System.out.println("Total Supplier Records:      " + totalSuppliers);
        System.out.println("Total SellerProfile Records: " + totalProfiles);
        System.out.println("Matched Identity Pairs:      " + matched);
        System.out.println("Supplier W/O Profile:        " + noProfile);
        System.out.println("Profile W/O Supplier:        " + noSupplier);
        System.out.println("Inconsistent Shared Fields:  " + inconsistent);
        System.out.println("============================================================");
    }
}
