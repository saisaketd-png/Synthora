package com.kemkendra.buyer.shortlist;

import com.kemkendra.buyer.shortlist.dto.AddShortlistItemRequest;
import com.kemkendra.buyer.shortlist.dto.BuyerShortlistResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/buyer/shortlists")
@PreAuthorize("hasRole('USER') or hasRole('BUYER') or hasRole('ADMIN')")
public class BuyerShortlistController {

    private final BuyerShortlistService shortlistService;

    public BuyerShortlistController(BuyerShortlistService shortlistService) {
        this.shortlistService = shortlistService;
    }

    @GetMapping
    public ResponseEntity<BuyerShortlistResponse> getShortlist(Authentication authentication) {
        return ResponseEntity.ok(shortlistService.getBuyerShortlist(authentication));
    }

    @PostMapping("/items")
    public ResponseEntity<BuyerShortlistResponse> addToShortlist(
            @RequestBody AddShortlistItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(shortlistService.addToShortlist(request, authentication));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<BuyerShortlistResponse> removeFromShortlist(
            @PathVariable UUID itemId,
            Authentication authentication) {
        return ResponseEntity.ok(shortlistService.removeFromShortlist(itemId, authentication));
    }
}
