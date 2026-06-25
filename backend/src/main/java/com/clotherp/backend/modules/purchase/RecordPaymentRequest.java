package com.clotherp.backend.modules.purchase;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request to record a payment against a Purchase Order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordPaymentRequest {

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than 0")
    private BigDecimal amount;

    /**
     * Optional notes (bank reference, cheque number, etc.).
     */
    private String notes;
}
