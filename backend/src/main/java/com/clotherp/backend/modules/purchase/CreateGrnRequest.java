package com.clotherp.backend.modules.purchase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request payload to record a Goods Receipt (GRN) against a Purchase Order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGrnRequest {

    @NotNull(message = "Purchase Order ID is required")
    private UUID purchaseOrderId;

    /**
     * Date the goods were physically received. Defaults to today if not provided.
     */
    private LocalDate receivedDate;

    /**
     * Supplier's delivery challan or packing slip reference.
     */
    private String supplierReference;

    /**
     * Warehouse / quality notes.
     */
    private String notes;

    @NotEmpty(message = "At least one item must be received")
    @Valid
    private List<GrnItemRequest> items;
}
