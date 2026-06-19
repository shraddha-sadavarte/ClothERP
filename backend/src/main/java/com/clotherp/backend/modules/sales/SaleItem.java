package com.clotherp.backend.modules.sales;

import com.clotherp.backend.common.BaseEntity;
import com.clotherp.backend.modules.product.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleItem extends BaseEntity {

    /**
     * The parent order this line item belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    /**
     * The product being sold on this line.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * Number of units ordered.
     */
    @Column(nullable = false)
    private int quantity;

    /**
     * Selling price per unit at the time of sale (snapshot to avoid price drift).
     */
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    /**
     * Line-level discount percentage (0–100).
     */
    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    /**
     * Computed: quantity × unitPrice × (1 - discountPercent/100).
     */
    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal lineTotal = BigDecimal.ZERO;
}
