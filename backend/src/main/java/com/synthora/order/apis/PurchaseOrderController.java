package com.synthora.order.apis;

import com.synthora.order.PurchaseOrderService;
import com.synthora.order.dto.CreatePurchaseOrderRequest;
import com.synthora.order.dto.PurchaseOrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('BUYER') or hasRole('USER')")
    public PurchaseOrderResponse createOrder(
            @Valid @RequestBody CreatePurchaseOrderRequest request,
            Authentication authentication) {
        return purchaseOrderService.createPurchaseOrder(request, authentication);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER')")
    public List<PurchaseOrderResponse> getMyOrders(Authentication authentication) {
        return purchaseOrderService.getBuyerOrders(authentication);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER')")
    public PurchaseOrderResponse getMyOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.getBuyerOrder(orderId, authentication);
    }

    @GetMapping("/supplier")
    @PreAuthorize("hasRole('SUPPLIER')")
    public List<PurchaseOrderResponse> getSupplierOrders(Authentication authentication) {
        return purchaseOrderService.getSupplierOrders(authentication);
    }

    @GetMapping("/supplier/{orderId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    public PurchaseOrderResponse getSupplierOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.getSupplierOrder(orderId, authentication);
    }

    @PostMapping("/supplier/{orderId}/confirm")
    @PreAuthorize("hasRole('SUPPLIER')")
    public PurchaseOrderResponse confirmSupplierOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.confirmSupplierOrder(orderId, authentication);
    }

    @GetMapping("/rfq/{rfqId}")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER') or hasRole('SUPPLIER')")
    public PurchaseOrderResponse getOrderByRfqId(
            @PathVariable UUID rfqId,
            Authentication authentication) {
        return purchaseOrderService.getOrderByRfqId(rfqId, authentication);
    }
}
