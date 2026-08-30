package com.kemkendra.seller;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.seller.dto.SellerProfileResponse;
import com.kemkendra.seller.dto.UpdateSellerProfileRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kemkendra.product.Supplier;
import com.kemkendra.product.SupplierRepository;

@Service
public class SellerProfileService {

    private final SellerProfileRepository sellerProfileRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierIdentityResolver identityResolver;
    private final UserRepository userRepository;

    public SellerProfileService(SellerProfileRepository sellerProfileRepository,
                                SupplierRepository supplierRepository,
                                SupplierIdentityResolver identityResolver,
                                UserRepository userRepository) {
        this.sellerProfileRepository = sellerProfileRepository;
        this.supplierRepository = supplierRepository;
        this.identityResolver = identityResolver;
        this.userRepository = userRepository;
    }

    @Transactional
    public SellerProfileResponse getMyProfile(Authentication authentication) {

        User user = getCurrentUser(authentication);

        SellerProfile profile = sellerProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    Supplier supplier = supplierRepository.findByUser(user).orElse(null);
                    SellerProfile newProfile = new SellerProfile();
                    newProfile.setUser(user);
                    newProfile.setCompanyName(supplier != null && supplier.getName() != null ? supplier.getName() : (user.getName() != null ? user.getName() : "Company"));
                    newProfile.setCountry(supplier != null && supplier.getCountryName() != null ? supplier.getCountryName() : "India");
                    return sellerProfileRepository.save(newProfile);
                });

        return mapToResponse(profile);
    }

    @Transactional
    public SellerProfileResponse updateMyProfile(
            UpdateSellerProfileRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        SellerProfile profile = sellerProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    SellerProfile newProfile = new SellerProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        profile.setCompanyName(request.companyName());
        profile.setGstNumber(request.gstNumber());
        profile.setAddress(request.address());
        profile.setCity(request.city());
        profile.setState(request.state());
        profile.setCountry(request.country());
        profile.setWebsite(request.website());
        profile.setCertifications(request.certifications());
        profile.setAboutCompany(request.aboutCompany());

        SellerProfile saved = sellerProfileRepository.save(profile);

        // Synchronize with the operational Supplier record using the canonical resolver
        // This will strictly throw if missing, preventing silent fabrication
        Supplier supplier = identityResolver.resolveOperationalSupplier(user);
        
        supplier.setName(request.companyName());
        supplier.setCountryName(request.country());
        supplierRepository.save(supplier);

        return mapToResponse(saved);
    }

    private User getCurrentUser(Authentication authentication) {

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SellerProfileResponse mapToResponse(SellerProfile profile) {

        return new SellerProfileResponse(
                profile.getId(),
                profile.getCompanyName(),
                profile.getGstNumber(),
                profile.getAddress(),
                profile.getCity(),
                profile.getState(),
                profile.getCountry(),
                profile.getWebsite(),
                profile.getCertifications(),
                profile.getAboutCompany(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}