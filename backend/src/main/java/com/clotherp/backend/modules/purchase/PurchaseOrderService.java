package com.clotherp.backend.modules.purchase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

/**
 * Purchase module business operations.
 *
 * <p>Covers the full procurement lifecycle:
 * <ol>
 *   <li>Create / manage Purchase Orders (PO)</li>
 *   <li>Approve / cancel POs</li>
 *   <li>Receive goods via Goods Receipt Notes (GRN)</li>
 *   <li>Record supplier payments</li>
 * </ol>
 */
public interface PurchaseOrderService {

    // ── Purchase Order CRUD ──────────────────────────────────────────────────

    /** Create a new PO in DRAFT status. */
    PurchaseOrderDTO createPurchaseOrder(CreatePurchaseOrderRequest request);

    /** Get a PO summary (no items). */
    PurchaseOrderDTO getPurchaseOrderById(UUID id);

    /** Get a PO with all line items (detail view). */
    PurchaseOrderDTO getPurchaseOrderWithItems(UUID id);

    /** Paginated list of all active POs. */
    Page<PurchaseOrderDTO> getAllPurchaseOrders(Pageable pageable);

    /** Paginated POs filtered by supplier. */
    Page<PurchaseOrderDTO> getPurchaseOrdersBySupplier(UUID supplierId, Pageable pageable);

    /** Paginated POs filtered by branch. */
    Page<PurchaseOrderDTO> getPurchaseOrdersByBranch(UUID branchId, Pageable pageable);

    /** POs filtered by status. */
    List<PurchaseOrderDTO> getPurchaseOrdersByStatus(PurchaseOrderStatus status);

    // ── PO Lifecycle ─────────────────────────────────────────────────────────

    /** Approve a DRAFT PO (moves it to APPROVED). */
    PurchaseOrderDTO approvePurchaseOrder(UUID id);

    /** Mark a PO as ORDERED (e.g. after sending to supplier). */
    PurchaseOrderDTO markAsOrdered(UUID id);

    /** Cancel a PO (only allowed in DRAFT or APPROVED state). */
    PurchaseOrderDTO cancelPurchaseOrder(UUID id);

    /** Soft-delete a PO (SUPER_ADMIN only). */
    void deletePurchaseOrder(UUID id);

    // ── Goods Receipt Note (GRN) ─────────────────────────────────────────────

    /**
     * Record receipt of goods for a PO.
     * This updates:
     * <ul>
     *   <li>PO line item {@code receivedQuantity}</li>
     *   <li>PO status (PARTIALLY_RECEIVED or RECEIVED)</li>
     *   <li>Inventory stock-in for accepted quantities</li>
     * </ul>
     */
    GoodsReceiptNoteDTO receiveGoods(CreateGrnRequest request);

    /** Get a GRN by ID (detail view). */
    GoodsReceiptNoteDTO getGrnById(UUID grnId);

    /** All GRNs for a given purchase order. */
    List<GoodsReceiptNoteDTO> getGrnsByPurchaseOrder(UUID purchaseOrderId);

    // ── Payments ─────────────────────────────────────────────────────────────

    /**
     * Record a payment against a PO.
     * Updates {@code paidAmount} and {@code paymentStatus}.
     */
    PurchaseOrderDTO recordPayment(UUID purchaseOrderId, RecordPaymentRequest request);
}
