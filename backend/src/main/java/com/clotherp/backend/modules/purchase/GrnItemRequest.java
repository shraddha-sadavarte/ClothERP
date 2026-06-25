package com.clotherp.backend.modules.purchase;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * Payload for a single line in a GRN (Goods Receipt) request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrnItemRequest {

    @NotNull(message = "PO Item ID is required")
    private UUID poItemId;

    @Min(value = 0, message = "Accepted quantity cannot be negative")
    private int acceptedQuantity;

    /**
     * Quantity rejected (damaged, wrong item). Defaults to 0.
     */
    @Builder.Default
    private int rejectedQuantity = 0;

    /**
     * Rack/shelf location where goods are stored.
     */
    private String rackLocation;
}
