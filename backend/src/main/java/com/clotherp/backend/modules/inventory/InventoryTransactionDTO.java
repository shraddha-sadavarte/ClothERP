package com.clotherp.backend.modules.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionDTO {
    private UUID id;
    private UUID inventoryItemId;
    private UUID productId;
    private String productName;
    private UUID branchId;
    private InventoryTransactionType type;
    private int quantity;
    private UUID referenceId;
    private String notes;
    private LocalDateTime createdAt;
}
