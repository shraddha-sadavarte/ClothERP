package com.clotherp.backend.modules.inventory;

import com.clotherp.backend.common.BaseEntity;
import com.clotherp.backend.modules.product.Product;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "inventory_items",
    uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "branch_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem extends BaseEntity {

    /**
     * The product this stock line belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /**
     * Which branch holds this stock.
     */
    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    /**
     * Current on-hand quantity (never goes below 0).
     */
    @Column(nullable = false)
    @Builder.Default
    private int quantity = 0;

    /**
     * Quantity reserved for open orders (not yet dispatched).
     */
    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private int reservedQuantity = 0;

    /**
     * Optional physical rack / shelf location in the warehouse.
     */
    @Column(name = "rack_location")
    private String rackLocation;

    /**
     * Computed available quantity = quantity - reservedQuantity.
     */
    @Transient
    public int getAvailableQuantity() {
        return quantity - reservedQuantity;
    }
}
