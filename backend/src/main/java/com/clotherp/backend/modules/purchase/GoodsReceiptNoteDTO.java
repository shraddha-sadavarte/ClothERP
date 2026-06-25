package com.clotherp.backend.modules.purchase;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full GRN response DTO (detail view includes items).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptNoteDTO {

    private UUID id;
    private String grnNumber;
    private UUID purchaseOrderId;
    private String poNumber;
    private UUID supplierId;
    private String supplierReference;
    private LocalDate receivedDate;
    private BigDecimal totalValue;
    private String notes;

    /** Populated only in detail view. */
    private List<GoodsReceiptItemDTO> items;

    private LocalDateTime createdAt;
}
