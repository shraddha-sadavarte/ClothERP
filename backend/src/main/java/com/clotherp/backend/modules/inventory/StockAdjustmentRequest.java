package com.clotherp.backend.modules.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    /**
     * Quantity to add (positive) or remove (negative).
     */
    @NotNull(message = "Quantity is required")
    private Integer quantity;

    /**
     * Must be STOCK_IN, STOCK_OUT, or ADJUSTMENT.
     */
    @NotNull(message = "Transaction type is required")
    private InventoryTransactionType type;

    /**
     * Optional reference document (e.g., Purchase Order ID).
     */
    private UUID referenceId;

    private String notes;

    private String rackLocation;
}
