package com.kemkendra.buyer.shortlist;

import com.kemkendra.buyer.shortlist.dto.AddShortlistItemRequest;
import com.kemkendra.buyer.shortlist.dto.BuyerShortlistResponse;
import com.kemkendra.buyer.shortlist.dto.ShortlistItemDto;
import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.product.SupplierOffering;
import com.kemkendra.product.SupplierOfferingRepository;
import com.kemkendra.product.verification.BestMatchScoringEngine;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BuyerShortlistService {

    private final BuyerShortlistRepository shortlistRepository;
    private final BuyerShortlistItemRepository itemRepository;
    private final SupplierOfferingRepository supplierOfferingRepository;
    private final UserRepository userRepository;
    private final BestMatchScoringEngine bestMatchScoringEngine;

    public BuyerShortlistService(
            BuyerShortlistRepository shortlistRepository,
            BuyerShortlistItemRepository itemRepository,
            SupplierOfferingRepository supplierOfferingRepository,
            UserRepository userRepository,
            BestMatchScoringEngine bestMatchScoringEngine) {
        this.shortlistRepository = shortlistRepository;
        this.itemRepository = itemRepository;
        this.supplierOfferingRepository = supplierOfferingRepository;
        this.userRepository = userRepository;
        this.bestMatchScoringEngine = bestMatchScoringEngine;
    }

    public BuyerShortlistResponse getBuyerShortlist(Authentication authentication) {
        User buyer = resolveUser(authentication);
        BuyerShortlist shortlist = shortlistRepository.findByBuyerId(buyer.getId())
                .orElseGet(() -> shortlistRepository.save(new BuyerShortlist(buyer.getId())));

        return toResponse(shortlist);
    }

    public BuyerShortlistResponse addToShortlist(AddShortlistItemRequest request, Authentication authentication) {
        User buyer = resolveUser(authentication);
        BuyerShortlist shortlist = shortlistRepository.findByBuyerId(buyer.getId())
                .orElseGet(() -> shortlistRepository.save(new BuyerShortlist(buyer.getId())));

        SupplierOffering offering = supplierOfferingRepository.findById(request.supplierOfferingId())
                .orElseThrow(() -> new ResourceNotFoundException("SupplierOffering not found: " + request.supplierOfferingId()));

        String modStatus = offering.getModerationStatus();
        if ("DEACTIVATED".equalsIgnoreCase(modStatus) || "SUSPENDED".equalsIgnoreCase(modStatus) || "REJECTED".equalsIgnoreCase(modStatus)) {
            throw new IllegalStateException("Cannot shortlist offering with status: " + modStatus);
        }

        if (itemRepository.existsByShortlistIdAndSupplierOfferingId(shortlist.getId(), offering.getId())) {
            return toResponse(shortlist);
        }

        BuyerShortlistItem item = new BuyerShortlistItem(shortlist, offering.getMasterProduct(), offering);
        itemRepository.save(item);

        return getBuyerShortlist(authentication);
    }

    public BuyerShortlistResponse removeFromShortlist(UUID itemId, Authentication authentication) {
        User buyer = resolveUser(authentication);
        BuyerShortlist shortlist = shortlistRepository.findByBuyerId(buyer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Shortlist not found for buyer"));

        BuyerShortlistItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Shortlist item not found: " + itemId));

        if (!item.getShortlist().getId().equals(shortlist.getId())) {
            throw new AccessDeniedException("Cannot remove item from another buyer's shortlist.");
        }

        itemRepository.delete(item);
        return getBuyerShortlist(authentication);
    }

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private BuyerShortlistResponse toResponse(BuyerShortlist shortlist) {
        List<BuyerShortlistItem> items = itemRepository.findByShortlistId(shortlist.getId());
        List<ShortlistItemDto> dtos = new ArrayList<>();

        for (BuyerShortlistItem item : items) {
            SupplierOffering off = item.getSupplierOffering();
            dtos.add(new ShortlistItemDto(
                    item.getId(),
                    item.getMasterProduct().getId(),
                    item.getMasterProduct().getName(),
                    item.getMasterProduct().getMasterProductCode(),
                    item.getMasterProduct().getCasNumber(),
                    off.getId(),
                    off.getSupplier().getId(),
                    off.getSupplier().getName(),
                    off.getSupplier().getVerificationStatus().name(),
                    off.getPrice(),
                    off.getCurrency(),
                    off.getPurity(),
                    off.getGrade(),
                    off.getMoqKg(),
                    off.getStock(),
                    off.getLeadTimeDays(),
                    off.getCoaAvailable(),
                    off.getMsdsAvailable(),
                    off.getExportReady(),
                    off.getModerationStatus(),
                    bestMatchScoringEngine.calculateBestMatch(off),
                    item.getCreatedAt()
            ));
        }

        return new BuyerShortlistResponse(
                shortlist.getId(),
                shortlist.getBuyerId(),
                dtos.size(),
                dtos,
                shortlist.getUpdatedAt()
        );
    }
}
