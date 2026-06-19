package com.clotherp.backend.modules.inventory;

import com.clotherp.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
     * POST /api/v1/inventory/adjust
     * Manually add or remove stock (STOCK_IN, STOCK_OUT, ADJUSTMENT).
     * Requires ADMIN or MANAGER role.
     */
    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItemDTO>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request) {
        InventoryItemDTO result = inventoryService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.ok(result, "Stock adjusted successfully"));
    }

    /**
     * POST /api/v1/inventory/transfer
     * Transfer stock from one branch to another (TRANSFER_IN / TRANSFER_OUT).
     * Requires ADMIN or MANAGER role.
     */
    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> transferStock(
            @Valid @RequestBody StockTransferRequest request) {
        inventoryService.transferStock(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Stock transferred successfully"));
    }

    /**
     * GET /api/v1/inventory/branch/{branchId}
     * Get all stock levels for a given branch.
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<InventoryItemDTO>>> getStockByBranch(
            @PathVariable UUID branchId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockByBranch(branchId)));
    }

    /**
     * GET /api/v1/inventory/product/{productId}/branch/{branchId}
     * Get stock level for a specific product at a specific branch.
     */
    @GetMapping("/product/{productId}/branch/{branchId}")
    public ResponseEntity<ApiResponse<InventoryItemDTO>> getStockByProductAndBranch(
            @PathVariable UUID productId,
            @PathVariable UUID branchId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getStockByProductAndBranch(productId, branchId)));
    }

    /**
     * GET /api/v1/inventory/branch/{branchId}/low-stock?threshold=5
     * Get products below a stock threshold at a given branch.
     */
    @GetMapping("/branch/{branchId}/low-stock")
    public ResponseEntity<ApiResponse<List<InventoryItemDTO>>> getLowStock(
            @PathVariable UUID branchId,
            @RequestParam(defaultValue = "5") int threshold) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getLowStock(branchId, threshold)));
    }

    /**
     * GET /api/v1/inventory/transactions/branch/{branchId}
     * Get paginated transaction history for a branch.
     */
    @GetMapping("/transactions/branch/{branchId}")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDTO>>> getTransactionsByBranch(
            @PathVariable UUID branchId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getTransactionsByBranch(branchId, pageable)));
    }

    /**
     * GET /api/v1/inventory/transactions/product/{productId}
     * Get paginated transaction history for a product across all branches.
     */
    @GetMapping("/transactions/product/{productId}")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionDTO>>> getTransactionsByProduct(
            @PathVariable UUID productId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getTransactionsByProduct(productId, pageable)));
    }
}
