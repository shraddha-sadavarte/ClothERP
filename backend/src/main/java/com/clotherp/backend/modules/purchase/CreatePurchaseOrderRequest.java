package com.clotherp.backend.modules.purchase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request payload to create a new Purchase Order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseOrderRequest {

    @NotNull(message = "Supplier ID is required")
    private UUID supplierId;

    @NotNull(message = "Branch ID is required")
    private UUID branchId;

    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<CreatePurchaseItemRequest> items;

    /**
     * Order-level discount amount (e.g. Rs 500 flat). Defaults to 0.
     */
    private BigDecimal discountAmount;

    /**
     * Tax / GST amount on the whole order. Defaults to 0.
     */
    private BigDecimal taxAmount;

    /**
     * Expected date of delivery.
     */
    private LocalDate expectedDeliveryDate;

    /**
     * Supplier's reference / quote number.
     */
    private String supplierInvoiceNumber;

    /**
     * Delivery address for this shipment.
     */
    private String deliveryAddress;

    /**
     * Internal notes.
     */
    private String notes;
}
