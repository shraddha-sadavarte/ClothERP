package com.clotherp.backend.modules.purchase;

import com.clotherp.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST API for the Purchase module.
 *
 * <p>Base path: {@code /api/v1/purchases}
 *
 * <p>Endpoints:
 * <ul>
 *   <li>POST   /api/v1/purchases                          — Create PO</li>
 *   <li>GET    /api/v1/purchases                          — List POs (paginated)</li>
 *   <li>GET    /api/v1/purchases/{id}                     — Get PO summary</li>
 *   <li>GET    /api/v1/purchases/{id}/details             — Get PO with items</li>
 *   <li>GET    /api/v1/purchases/supplier/{supplierId}    — POs by supplier</li>
 *   <li>GET    /api/v1/purchases/branch/{branchId}        — POs by branch</li>
 *   <li>GET    /api/v1/purchases/status/{status}          — POs by status</li>
 *   <li>POST   /api/v1/purchases/{id}/approve             — Approve PO</li>
 *   <li>POST   /api/v1/purchases/{id}/order               — Mark as ORDERED</li>
 *   <li>POST   /api/v1/purchases/{id}/cancel              — Cancel PO</li>
 *   <li>DELETE /api/v1/purchases/{id}                     — Soft-delete PO</li>
 *   <li>POST   /api/v1/purchases/{id}/receive             — Record GRN</li>
 *   <li>GET    /api/v1/purchases/{id}/grns                — All GRNs for PO</li>
 *   <li>GET    /api/v1/purchases/grns/{grnId}             — GRN detail</li>
 *   <li>POST   /api/v1/purchases/{id}/payments            — Record payment</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchase", description = "Purchase order and goods receipt management")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    // ── Create PO ────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'PURCHASE_MANAGER')")
    @Operation(summary = "Create a new Purchase Order in DRAFT status")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> createPurchaseOrder(
            @Valid @RequestBody CreatePurchaseOrderRequest request) {
        PurchaseOrderDTO created = purchaseOrderService.createPurchaseOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created, "Purchase order created successfully"));
    }

    // ── List POs ─────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all purchase orders (paginated)")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderDTO>>> getAllPurchaseOrders(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseOrderService.getAllPurchaseOrders(pageable)));
    }

    @GetMapping("/supplier/{supplierId}")
    @Operation(summary = "List purchase orders by supplier")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderDTO>>> getBySupplier(
            @PathVariable UUID supplierId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.getPurchaseOrdersBySupplier(supplierId, pageable)));
    }

    @GetMapping("/branch/{branchId}")
    @Operation(summary = "List purchase orders by branch")
    public ResponseEntity<ApiResponse<Page<PurchaseOrderDTO>>> getByBranch(
            @PathVariable UUID branchId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.getPurchaseOrdersByBranch(branchId, pageable)));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "List purchase orders by status")
    public ResponseEntity<ApiResponse<List<PurchaseOrderDTO>>> getByStatus(
            @PathVariable PurchaseOrderStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.getPurchaseOrdersByStatus(status)));
    }

    // ── Get PO detail ────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order summary (no items)")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> getPurchaseOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseOrderService.getPurchaseOrderById(id)));
    }

    @GetMapping("/{id}/details")
    @Operation(summary = "Get purchase order with all line items")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> getPurchaseOrderDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseOrderService.getPurchaseOrderWithItems(id)));
    }

    // ── PO Lifecycle ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    @Operation(summary = "Approve a DRAFT purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> approvePurchaseOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.approvePurchaseOrder(id), "Purchase order approved"));
    }

    @PostMapping("/{id}/order")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'PURCHASE_MANAGER')")
    @Operation(summary = "Mark an APPROVED purchase order as ORDERED")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> markAsOrdered(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.markAsOrdered(id), "Purchase order marked as ORDERED"));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    @Operation(summary = "Cancel a purchase order (DRAFT or APPROVED only)")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> cancelPurchaseOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.cancelPurchaseOrder(id), "Purchase order cancelled"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Soft-delete a purchase order")
    public ResponseEntity<ApiResponse<Void>> deletePurchaseOrder(@PathVariable UUID id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Purchase order deleted"));
    }

    // ── Goods Receipt Notes ───────────────────────────────────────────────────

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'WAREHOUSE_MANAGER', 'PURCHASE_MANAGER')")
    @Operation(summary = "Record goods receipt (GRN) for a purchase order")
    public ResponseEntity<ApiResponse<GoodsReceiptNoteDTO>> receiveGoods(
            @PathVariable UUID id,
            @Valid @RequestBody CreateGrnRequest request) {
        // Ensure the path variable PO id is used (override if caller left it blank)
        request.setPurchaseOrderId(id);
        GoodsReceiptNoteDTO grn = purchaseOrderService.receiveGoods(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(grn, "Goods receipt recorded: " + grn.getGrnNumber()));
    }

    @GetMapping("/{id}/grns")
    @Operation(summary = "List all GRNs for a purchase order")
    public ResponseEntity<ApiResponse<List<GoodsReceiptNoteDTO>>> getGrnsByPo(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseOrderService.getGrnsByPurchaseOrder(id)));
    }

    @GetMapping("/grns/{grnId}")
    @Operation(summary = "Get GRN details by ID")
    public ResponseEntity<ApiResponse<GoodsReceiptNoteDTO>> getGrnById(@PathVariable UUID grnId) {
        return ResponseEntity.ok(ApiResponse.ok(purchaseOrderService.getGrnById(grnId)));
    }

    // ── Payments ─────────────────────────────────────────────────────────────

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'ACCOUNTANT', 'PURCHASE_MANAGER')")
    @Operation(summary = "Record a payment against a purchase order")
    public ResponseEntity<ApiResponse<PurchaseOrderDTO>> recordPayment(
            @PathVariable UUID id,
            @Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                purchaseOrderService.recordPayment(id, request),
                "Payment recorded successfully"));
    }
}
