package com.clotherp.backend.modules.inventory;

import com.clotherp.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransaction extends BaseEntity {

    /**
     * The inventory stock line this transaction affects.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    /**
     * Type of transaction (STOCK_IN, STOCK_OUT, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InventoryTransactionType type;

    /**
     * Quantity changed by this transaction (positive = added, negative = removed).
     */
    @Column(nullable = false)
    private int quantity;

    /**
     * Optional reference to a source document (e.g. Purchase Order ID, Invoice ID).
     */
    @Column(name = "reference_id")
    private UUID referenceId;

    /**
     * Optional human-readable note for this stock movement.
     */
    @Column(columnDefinition = "text")
    private String notes;
}
