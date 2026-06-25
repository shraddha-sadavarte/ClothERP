package com.clotherp.backend.modules.purchase;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a single PO line item (used inside PurchaseOrderDTO).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItemDTO {

    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private int orderedQuantity;
    private int receivedQuantity;
    private int pendingQuantity;
    private BigDecimal unitCost;
    private BigDecimal discountPercent;
    private BigDecimal lineTotal;
    private String rackLocation;
    private LocalDateTime createdAt;
}
