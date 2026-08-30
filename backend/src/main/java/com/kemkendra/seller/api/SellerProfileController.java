package com.kemkendra.seller.api;

import com.kemkendra.seller.SellerProfileService;
import com.kemkendra.seller.dto.SellerProfileResponse;
import com.kemkendra.seller.dto.UpdateSellerProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/sellers")
public class SellerProfileController {

    private final SellerProfileService sellerProfileService;

    public SellerProfileController(SellerProfileService sellerProfileService) {
        this.sellerProfileService = sellerProfileService;
    }

    @PreAuthorize("hasAnyRole('SUPPLIER','ADMIN')")
    @GetMapping("/me")
    public ResponseEntity<SellerProfileResponse> getMyProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                sellerProfileService.getMyProfile(authentication)
        );
    }

    @PreAuthorize("hasAnyRole('SUPPLIER','ADMIN')")
    @PutMapping("/me")
    public ResponseEntity<SellerProfileResponse> updateMyProfile(
            @Valid @RequestBody UpdateSellerProfileRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                sellerProfileService.updateMyProfile(request, authentication)
        );
    }
}