package com.clotherp.backend.modules.purchase;

import com.clotherp.backend.common.BaseEntity;
import com.clotherp.backend.modules.product.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * One line of a Goods Receipt Note — maps received quantity to a PO line item.
 */
@Entity
@Table(name = "goods_receipt_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptItem extends BaseEntity {

    /**
     * Parent GRN.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grn_id", nullable = false)
    private GoodsReceiptNote goodsReceiptNote;

    /**
     * The corresponding PO line item.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "po_item_id", nullable = false)
    private PurchaseOrderItem purchaseOrderItem;

    /**
     * Product (denormalized for quick access without traversing PO item).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * Quantity actually received and accepted.
     */
    @Column(name = "accepted_quantity", nullable = false)
    private int acceptedQuantity;

    /**
     * Quantity rejected (damaged, wrong item, etc.).
     */
    @Column(name = "rejected_quantity", nullable = false)
    @Builder.Default
    private int rejectedQuantity = 0;

    /**
     * Unit cost at time of receipt (carried from PO line).
     */
    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitCost;

    /**
     * Line value = acceptedQuantity × unitCost.
     */
    @Column(name = "line_value", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal lineValue = BigDecimal.ZERO;

    /**
     * Rack / shelf where accepted items were stored.
     */
    @Column(name = "rack_location")
    private String rackLocation;
}
