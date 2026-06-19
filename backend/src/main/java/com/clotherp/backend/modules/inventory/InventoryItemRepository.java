package com.clotherp.backend.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

    Optional<InventoryItem> findByProductIdAndBranchId(UUID productId, UUID branchId);

    List<InventoryItem> findByBranchId(UUID branchId);

    List<InventoryItem> findByProductId(UUID productId);

    /**
     * Fetch all inventory items for a branch where available stock is below a threshold.
     */
    @Query("SELECT i FROM InventoryItem i WHERE i.branchId = :branchId AND (i.quantity - i.reservedQuantity) <= :threshold")
    List<InventoryItem> findLowStockByBranch(@Param("branchId") UUID branchId, @Param("threshold") int threshold);
}
