package com.clotherp.backend.modules.purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoodsReceiptNoteRepository extends JpaRepository<GoodsReceiptNote, UUID> {

    boolean existsByGrnNumber(String grnNumber);

    Optional<GoodsReceiptNote> findByGrnNumber(String grnNumber);

    /**
     * Fetch all GRNs for a given purchase order (summary).
     */
    List<GoodsReceiptNote> findByPurchaseOrderId(UUID purchaseOrderId);

    /**
     * Fetch a GRN with all its items, PO items, and products in one query.
     */
    @Query("""
            SELECT DISTINCT grn FROM GoodsReceiptNote grn
            LEFT JOIN FETCH grn.items gi
            LEFT JOIN FETCH gi.purchaseOrderItem poi
            LEFT JOIN FETCH gi.product
            WHERE grn.id = :id
            """)
    Optional<GoodsReceiptNote> findByIdWithItems(@Param("id") UUID id);

    /**
     * All GRNs for a specific supplier (via PO).
     */
    @Query("""
            SELECT grn FROM GoodsReceiptNote grn
            WHERE grn.purchaseOrder.supplierId = :supplierId
            ORDER BY grn.receivedDate DESC
            """)
    List<GoodsReceiptNote> findBySupplierId(@Param("supplierId") UUID supplierId);
}
