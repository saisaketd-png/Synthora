package com.kemkendra.seller;

import com.kemkendra.identity.User;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.List;

@Component
public class SupplierIdentityResolver {

    private final SupplierRepository supplierRepository;
    private final SellerProfileRepository sellerProfileRepository;

    public SupplierIdentityResolver(SupplierRepository supplierRepository,
                                    SellerProfileRepository sellerProfileRepository) {
        this.supplierRepository = supplierRepository;
        this.sellerProfileRepository = sellerProfileRepository;
    }

    /**
     * Resolves the operational Supplier record for the given user.
     * Throws an explicit error if missing, preventing silent fabrication.
     */
    public Supplier resolveOperationalSupplier(User user) {
        return supplierRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("Operational Supplier record is missing for user: " + user.getId()));
    }

    /**
     * Resolves the operational Supplier record safely without throwing an exception.
     */
    public Optional<Supplier> resolveOperationalSupplierOptional(User user) {
        return supplierRepository.findByUser(user);
    }

    /**
     * Resolves the editable SellerProfile for the given user.
     */
    public Optional<SellerProfile> resolveEditableProfile(User user) {
        return sellerProfileRepository.findByUser(user);
    }

    /**
     * Resolves multiple editable SellerProfiles for a list of users.
     */
    public List<SellerProfile> resolveEditableProfiles(List<User> users) {
        return sellerProfileRepository.findByUserIn(users);
    }
}
