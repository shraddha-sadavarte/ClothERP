package com.clotherp.backend.modules.purchase;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full Purchase Order response DTO (detail view includes items).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderDTO {

    private UUID id;
    private String poNumber;
    private UUID supplierId;
    private UUID branchId;
    private PurchaseOrderStatus status;
    private PurchasePaymentStatus paymentStatus;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;

    /** Computed: totalAmount - paidAmount */
    private BigDecimal balanceDue;

    private LocalDate expectedDeliveryDate;
    private String supplierInvoiceNumber;
    private String deliveryAddress;
    private String notes;

    /** Populated only in detail view. */
    private List<PurchaseOrderItemDTO> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
