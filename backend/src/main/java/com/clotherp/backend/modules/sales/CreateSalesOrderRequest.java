package com.clotherp.backend.modules.sales;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSalesOrderRequest {

    /** Customer placing the order (optional if walk-in). */
    private UUID customerId;

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<CreateSaleItemRequest> items;

    /** Order-level discount amount (not per-item). */
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /** Tax amount to apply to the whole order. */
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    private String shippingAddress;

    private String notes;
}
