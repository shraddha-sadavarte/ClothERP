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
public class InventoryItemDTO {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private UUID branchId;
    private int quantity;
    private int reservedQuantity;
    private int availableQuantity;
    private String rackLocation;
    private LocalDateTime updatedAt;
}
