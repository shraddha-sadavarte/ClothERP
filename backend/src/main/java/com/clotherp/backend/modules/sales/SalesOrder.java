package com.clotherp.backend.modules.sales;

import com.clotherp.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sales_orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrder extends BaseEntity {

    /**
     * Human-readable order number, auto-generated (e.g. SO-20240001).
     */
    @Column(name = "order_number", unique = true, nullable = false)
    private String orderNumber;

    /**
     * Customer who placed the order (links to a customer record by UUID).
     */
    @Column(name = "customer_id")
    private UUID customerId;

    /**
     * Branch that owns / fulfills this order.
     */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /**
     * Current stage in the order lifecycle.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SalesOrderStatus status = SalesOrderStatus.DRAFT;

    /**
     * Current payment state.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /**
     * Sum of all line totals before discount/tax.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    /**
     * Total order-level discount amount.
     */
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /**
     * Tax amount applied to the order.
     */
    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    /**
     * Final amount = subtotal - discountAmount + taxAmount.
     */
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /**
     * Optional shipping / delivery address.
     */
    @Column(name = "shipping_address", columnDefinition = "text")
    private String shippingAddress;

    /**
     * Optional internal notes for the order.
     */
    @Column(columnDefinition = "text")
    private String notes;

    /**
     * Line items belonging to this order.
     * CascadeType.ALL ensures items are saved/deleted with the order.
     */
    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();
}
