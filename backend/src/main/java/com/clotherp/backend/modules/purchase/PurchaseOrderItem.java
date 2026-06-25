package com.clotherp.backend.modules.purchase;

import com.clotherp.backend.common.BaseEntity;
import com.clotherp.backend.modules.product.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * One line item inside a PurchaseOrder.
 * Tracks ordered quantity, unit cost, discount, and actual received quantity.
 */
@Entity
@Table(name = "purchase_order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItem extends BaseEntity {

    /**
     * The parent purchase order.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    /**
     * The product being ordered.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * Quantity ordered from the supplier.
     */
    @Column(name = "ordered_quantity", nullable = false)
    private int orderedQuantity;

    /**
     * Quantity actually received so far (updated on GRN).
     */
    @Column(name = "received_quantity", nullable = false)
    @Builder.Default
    private int receivedQuantity = 0;

    /**
     * Agreed cost price per unit.
     */
    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    /**
     * Line-level discount percentage (0–100).
     */
    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    /**
     * lineTotal = orderedQuantity × unitCost × (1 - discountPercent/100)
     */
    @Column(name = "line_total", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal lineTotal = BigDecimal.ZERO;

    /**
     * Optional rack/location hint for the warehouse team.
     */
    @Column(name = "rack_location")
    private String rackLocation;

    /**
     * Computed: how many units still outstanding.
     */
    @Transient
    public int getPendingQuantity() {
        return orderedQuantity - receivedQuantity;
    }
}
