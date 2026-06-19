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
public class StockTransferRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "Source branch ID is required")
    private UUID fromBranchId;

    @NotNull(message = "Destination branch ID is required")
    private UUID toBranchId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Transfer quantity must be at least 1")
    private Integer quantity;

    private String notes;
}
