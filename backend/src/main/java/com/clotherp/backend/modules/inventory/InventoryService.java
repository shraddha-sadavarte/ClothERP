package com.clotherp.backend.modules.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventoryService {

    InventoryItemDTO adjustStock(StockAdjustmentRequest request);

    void transferStock(StockTransferRequest request);

    InventoryItemDTO getStockByProductAndBranch(UUID productId, UUID branchId);

    List<InventoryItemDTO> getStockByBranch(UUID branchId);

    List<InventoryItemDTO> getLowStock(UUID branchId, int threshold);

    Page<InventoryTransactionDTO> getTransactionsByBranch(UUID branchId, Pageable pageable);

    Page<InventoryTransactionDTO> getTransactionsByProduct(UUID productId, Pageable pageable);
}
