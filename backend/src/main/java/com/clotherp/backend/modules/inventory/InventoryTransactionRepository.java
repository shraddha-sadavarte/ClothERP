package com.clotherp.backend.modules.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, UUID> {

    Page<InventoryTransaction> findByInventoryItemId(UUID inventoryItemId, Pageable pageable);

    Page<InventoryTransaction> findByInventoryItemBranchId(UUID branchId, Pageable pageable);

    Page<InventoryTransaction> findByInventoryItemProductId(UUID productId, Pageable pageable);
}
