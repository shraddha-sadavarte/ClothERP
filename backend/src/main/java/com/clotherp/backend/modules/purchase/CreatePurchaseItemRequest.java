package com.clotherp.backend.modules.purchase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payload for a single line item inside a CreatePurchaseOrderRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseItemRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @Min(value = 1, message = "Ordered quantity must be at least 1")
    private int orderedQuantity;

    @NotNull(message = "Unit cost is required")
    @DecimalMin(value = "0.00", inclusive = false, message = "Unit cost must be greater than 0")
    private BigDecimal unitCost;

    /**
     * Optional line-level discount (0–100). Defaults to 0 if not provided.
     */
    private BigDecimal discountPercent;

    /**
     * Optional rack/location hint.
     */
    private String rackLocation;
}
