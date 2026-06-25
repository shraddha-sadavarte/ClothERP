package com.clotherp.backend.modules.purchase;

import com.clotherp.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a Purchase Order raised to a supplier.
 *
 * Lifecycle: DRAFT → APPROVED → ORDERED → PARTIALLY_RECEIVED → RECEIVED → CLOSED
 */
@Entity
@Table(name = "purchase_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder extends BaseEntity {

    /**
     * Human-readable PO number, e.g. PO-20240001.
     * Generated automatically on creation.
     */
    @Column(name = "po_number", unique = true, nullable = false)
    private String poNumber;

    /**
     * Supplier (vendor) UUID — references a supplier record.
     */
    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    /**
     * Branch that is placing / receiving this order.
     */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /**
     * Lifecycle status of this PO.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    /**
     * Payment status (UNPAID / PARTIALLY_PAID / PAID).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    @Builder.Default
    private PurchasePaymentStatus paymentStatus = PurchasePaymentStatus.UNPAID;

    /**
     * Sum of all line totals (before discount / tax).
     */
    @Column(nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    /**
     * Order-level discount amount.
     */
    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /**
     * Tax / GST amount applied to the order.
     */
    @Column(name = "tax_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /**
     * Final payable = subtotal - discountAmount + taxAmount.
     */
    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /**
     * Amount already paid to the supplier.
     */
    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    /**
     * Expected delivery date communicated by the supplier.
     */
    @Column(name = "expected_delivery_date")
    private java.time.LocalDate expectedDeliveryDate;

    /**
     * Supplier's reference / invoice number (filled when goods arrive).
     */
    @Column(name = "supplier_invoice_number")
    private String supplierInvoiceNumber;

    /**
     * Delivery / billing address.
     */
    @Column(name = "delivery_address", columnDefinition = "text")
    private String deliveryAddress;

    /**
     * Internal notes or instructions.
     */
    @Column(columnDefinition = "text")
    private String notes;

    /**
     * Line items of this purchase order.
     */
    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PurchaseOrderItem> items = new ArrayList<>();
}
