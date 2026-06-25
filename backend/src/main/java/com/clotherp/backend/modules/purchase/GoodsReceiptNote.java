package com.clotherp.backend.modules.purchase;

import com.clotherp.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Goods Receipt Note (GRN) — records the physical receipt of goods against a PO.
 * Each GRN may cover a partial or full delivery.
 */
@Entity
@Table(name = "goods_receipt_notes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptNote extends BaseEntity {

    /**
     * Human-readable GRN number, e.g. GRN-20240001.
     */
    @Column(name = "grn_number", unique = true, nullable = false)
    private String grnNumber;

    /**
     * The purchase order this receipt is for.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    /**
     * Supplier's delivery challan / reference number.
     */
    @Column(name = "supplier_reference")
    private String supplierReference;

    /**
     * Date goods were physically received.
     */
    @Column(name = "received_date", nullable = false)
    private java.time.LocalDate receivedDate;

    /**
     * Any quality or warehouse notes.
     */
    @Column(columnDefinition = "text")
    private String notes;

    /**
     * Total value of goods received in this GRN.
     */
    @Column(name = "total_value", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalValue = BigDecimal.ZERO;

    /**
     * Line items received in this GRN.
     */
    @OneToMany(mappedBy = "goodsReceiptNote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GoodsReceiptItem> items = new ArrayList<>();
}
