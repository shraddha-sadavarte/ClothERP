package com.clotherp.backend.modules.pos;

import com.clotherp.backend.modules.sales.PaymentMethod;
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
public class POSCheckoutRequest {

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    private UUID customerId;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<POSCheckoutItem> items;

    private BigDecimal discountAmount = BigDecimal.ZERO;

    private BigDecimal taxAmount = BigDecimal.ZERO;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
}