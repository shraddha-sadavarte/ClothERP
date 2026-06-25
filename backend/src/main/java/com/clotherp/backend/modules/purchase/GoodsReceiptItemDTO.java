package com.clotherp.backend.modules.purchase;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for a single GRN line item.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptItemDTO {

    private UUID id;
    private UUID poItemId;
    private UUID productId;
    private String productName;
    private String productSku;
    private int acceptedQuantity;
    private int rejectedQuantity;
    private BigDecimal unitCost;
    private BigDecimal lineValue;
    private String rackLocation;
    private LocalDateTime createdAt;
}
