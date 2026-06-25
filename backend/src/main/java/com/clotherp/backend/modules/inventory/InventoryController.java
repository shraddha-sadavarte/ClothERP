package com.clotherp.backend.modules.inventory;

import com.clotherp.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * GET /api/v1/inventory/branch/{branchId}
     * List all inventory items for a branch.
     */
    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','WAREHOUSE_MANAGER','SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<InventoryItemDTO>>> getStockByBranch(@PathVariable UUID branchId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockByBranch(branchId)));
    }

    /**
     * GET /api/v1/inventory/low-stock
     * List items with available stock below threshold.
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<List<InventoryItemDTO>>> getLowStock(
            @RequestParam UUID branchId,
            @RequestParam(defaultValue = "5") int threshold) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getLowStock(branchId, threshold)));
    }

    /**
     * GET /api/v1/inventory/product/{productId}/branch/{branchId}
     * Get a specific stock item.
     */
    @GetMapping("/product/{productId}/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItemDTO>> getStockByProductAndBranch(
            @PathVariable UUID productId,
            @PathVariable UUID branchId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockByProductAndBranch(productId, branchId)));
    }

    /**
     * POST /api/v1/inventory/adjust
     * Adjust stock (add/remove) for a product in a branch.
     */
    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItemDTO>> adjustStock(@Valid @RequestBody StockAdjustmentRequest request) {
        InventoryItemDTO updated = inventoryService.adjustStock(request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.ok(updated, "Stock adjusted successfully"));
    }

    /**
     * POST /api/v1/inventory/transfer
     * Transfer stock between two branches.
     */
    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> transferStock(@Valid @RequestBody StockTransferRequest request) {
        inventoryService.transferStock(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Stock transferred successfully"));
    }

    /**
     * GET /api/v1/inventory/transactions/branch/{branchId}
     * List transaction history for a branch.
     */
    @GetMapping("/transactions/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDTO>>> getTransactionsByBranch(
            @PathVariable UUID branchId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getTransactionsByBranch(branchId, pageable)));
    }

    /**
     * GET /api/v1/inventory/transactions/product/{productId}
     * List transaction history for a product across all branches.
     */
    @GetMapping("/transactions/product/{productId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','WAREHOUSE_MANAGER')")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDTO>>> getTransactionsByProduct(
            @PathVariable UUID productId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getTransactionsByProduct(productId, pageable)));
    }
}