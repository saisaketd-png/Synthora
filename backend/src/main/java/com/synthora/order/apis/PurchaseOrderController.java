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

    @PostMapping("/supplier/{orderId}/reject")
    @PreAuthorize("hasRole('SUPPLIER')")
    public PurchaseOrderResponse rejectSupplierOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody com.synthora.order.dto.RejectPurchaseOrderRequest request,
            Authentication authentication) {
        return purchaseOrderService.rejectSupplierOrder(orderId, request, authentication);
    }

    @GetMapping("/rfq/{rfqId}")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER') or hasRole('SUPPLIER')")
    public PurchaseOrderResponse getOrderByRfqId(
            @PathVariable UUID rfqId,
            Authentication authentication) {
        return purchaseOrderService.getOrderByRfqId(rfqId, authentication);
    }

    @PostMapping("/supplier/{orderId}/process")
    @PreAuthorize("hasRole('SUPPLIER')")
    public PurchaseOrderResponse processSupplierOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.startProcessingSupplierOrder(orderId, authentication);
    }

    @PostMapping("/supplier/{orderId}/ship")
    @PreAuthorize("hasRole('SUPPLIER')")
    public PurchaseOrderResponse shipSupplierOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody com.synthora.order.dto.ShipOrderRequest request,
            Authentication authentication) {
        return purchaseOrderService.shipSupplierOrder(orderId, request.carrier(), request.trackingNumber(), request.estimatedDeliveryDate(), authentication);
    }

    @GetMapping("/{orderId}/shipment")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER') or hasRole('SUPPLIER')")
    public com.synthora.order.dto.ShipmentResponse getShipment(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.getShipment(orderId, authentication);
    }

    @PostMapping("/{orderId}/deliver")
    @PreAuthorize("hasRole('SUPPLIER')")
    public PurchaseOrderResponse deliverOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.markOrderDeliveredSupplier(orderId, authentication);
    }

    @PostMapping("/{orderId}/receive")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER')")
    public PurchaseOrderResponse confirmReceiptOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.confirmReceiptBuyerOrder(orderId, authentication);
    }

    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER')")
    public PurchaseOrderResponse cancelOrder(
            @PathVariable UUID orderId,
            @Valid @RequestBody com.synthora.order.dto.CancelPurchaseOrderRequest request,
            Authentication authentication) {
        return purchaseOrderService.cancelBuyerOrder(orderId, request, authentication);
    }

    @PostMapping("/{orderId}/complete")
    @PreAuthorize("hasRole('BUYER') or hasRole('USER') or hasRole('SUPPLIER') or hasRole('ADMIN')")
    public PurchaseOrderResponse completeOrder(
            @PathVariable UUID orderId,
            Authentication authentication) {
        return purchaseOrderService.completeOrder(orderId, authentication);
    }
}
