package com.clotherp.backend.modules.purchase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    boolean existsByPoNumber(String poNumber);

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    /**
     * Fetch a PO with its items + products eagerly (avoids N+1 in detail view).
     */
    @Query("""
            SELECT DISTINCT po FROM PurchaseOrder po
            LEFT JOIN FETCH po.items i
            LEFT JOIN FETCH i.product
            WHERE po.id = :id AND po.isDeleted = false
            """)
    Optional<PurchaseOrder> findByIdWithItems(@Param("id") UUID id);

    /**
     * Paginated list — no items fetched (summary view).
     */
    @Query(value = """
            SELECT po FROM PurchaseOrder po
            WHERE po.isDeleted = false
            """,
            countQuery = "SELECT COUNT(po) FROM PurchaseOrder po WHERE po.isDeleted = false")
    Page<PurchaseOrder> findAllActive(Pageable pageable);

    /**
     * Filter by supplier.
     */
    @Query(value = """
            SELECT po FROM PurchaseOrder po
            WHERE po.supplierId = :supplierId AND po.isDeleted = false
            """,
            countQuery = "SELECT COUNT(po) FROM PurchaseOrder po WHERE po.supplierId = :supplierId AND po.isDeleted = false")
    Page<PurchaseOrder> findBySupplierId(@Param("supplierId") UUID supplierId, Pageable pageable);

    /**
     * Filter by branch.
     */
    @Query(value = """
            SELECT po FROM PurchaseOrder po
            WHERE po.branchId = :branchId AND po.isDeleted = false
            """,
            countQuery = "SELECT COUNT(po) FROM PurchaseOrder po WHERE po.branchId = :branchId AND po.isDeleted = false")
    Page<PurchaseOrder> findByBranchId(@Param("branchId") UUID branchId, Pageable pageable);

    /**
     * Filter by status.
     */
    List<PurchaseOrder> findByStatusAndIsDeletedFalse(PurchaseOrderStatus status);
}
