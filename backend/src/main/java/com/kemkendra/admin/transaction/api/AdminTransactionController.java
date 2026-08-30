package com.kemkendra.admin.transaction.api;

import com.kemkendra.admin.transaction.AdminTransactionService;
import com.kemkendra.admin.transaction.dto.*;
import com.kemkendra.order.OrderStatus;
import com.kemkendra.rfq.RfqStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller exposing administrative transaction oversight endpoints for RFQs,
 * Quotations, Purchase Orders, and Shipments.
 * Strictly restricted to administrators via {@code @PreAuthorize("hasRole('ADMIN')")}.
 */
@RestController
@RequestMapping("/api/v1/admin/transactions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTransactionController {

    private final AdminTransactionService adminTransactionService;

    public AdminTransactionController(AdminTransactionService adminTransactionService) {
        this.adminTransactionService = adminTransactionService;
    }

    @GetMapping("/rfqs")
    public ResponseEntity<Page<AdminRfqResponse>> getRfqs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) RfqStatus status,
            @RequestParam(required = false) UUID buyerId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String query) {

        return ResponseEntity.ok(adminTransactionService.getRfqs(
                page,
                size,
                status,
                buyerId,
                supplierId,
                productId,
                query
        ));
    }

    @GetMapping("/rfqs/{id}")
    public ResponseEntity<AdminRfqDetailResponse> getRfqDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminTransactionService.getRfqDetail(id));
    }

    @PutMapping("/rfqs/{id}/status")
    public ResponseEntity<AdminRfqResponse> updateRfqStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminRfqStatusRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminTransactionService.updateRfqStatus(
                id,
                request,
                authentication,
                servletRequest
        ));
    }

    @GetMapping("/orders")
    public ResponseEntity<Page<AdminPurchaseOrderResponse>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) UUID buyerId,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String poNumber,
            @RequestParam(required = false) String query) {

        return ResponseEntity.ok(adminTransactionService.getOrders(
                page,
                size,
                status,
                buyerId,
                supplierId,
                productId,
                poNumber,
                query
        ));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<AdminPurchaseOrderDetailResponse> getOrderDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(adminTransactionService.getOrderDetail(id));
    }

    @PutMapping("/orders/{id}/cancel")
    public ResponseEntity<AdminPurchaseOrderResponse> cancelOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CancelAdminPurchaseOrderRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminTransactionService.cancelOrder(
                id,
                request,
                authentication,
                servletRequest
        ));
    }
}
