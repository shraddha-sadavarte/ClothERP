package com.clotherp.backend.modules.inventory;

import com.clotherp.backend.modules.product.Product;
import com.clotherp.backend.modules.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;

    // ── Stock Adjustment ──────────────────────────────────────────────────────

    @Override
    public InventoryItemDTO adjustStock(StockAdjustmentRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + request.getProductId()));

        // Find existing inventory item or create a new one for this product+branch
        InventoryItem item = inventoryItemRepository
                .findByProductIdAndBranchId(request.getProductId(), request.getBranchId())
                .orElseGet(() -> InventoryItem.builder()
                        .product(product)
                        .branchId(request.getBranchId())
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        if (request.getRackLocation() != null) {
            item.setRackLocation(request.getRackLocation());
        }

        int newQty = item.getQuantity() + request.getQuantity();
        if (newQty < 0) {
            throw new IllegalStateException("Insufficient stock. Available: " + item.getAvailableQuantity()
                    + ", Requested: " + Math.abs(request.getQuantity()));
        }
        item.setQuantity(newQty);
        InventoryItem saved = inventoryItemRepository.save(item);

        // Record this change in the audit trail
        InventoryTransaction transaction = InventoryTransaction.builder()
                .inventoryItem(saved)
                .type(request.getType())
                .quantity(request.getQuantity())
                .referenceId(request.getReferenceId())
                .notes(request.getNotes())
                .build();
        transactionRepository.save(transaction);

        return toItemDTO(saved);
    }

    // ── Stock Transfer ────────────────────────────────────────────────────────

    @Override
    public void transferStock(StockTransferRequest request) {
        // Deduct from source branch
        InventoryItem source = inventoryItemRepository
                .findByProductIdAndBranchId(request.getProductId(), request.getFromBranchId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No stock found for this product at the source branch."));

        if (source.getAvailableQuantity() < request.getQuantity()) {
            throw new IllegalStateException("Insufficient available stock at source branch. Available: "
                    + source.getAvailableQuantity());
        }

        source.setQuantity(source.getQuantity() - request.getQuantity());
        inventoryItemRepository.save(source);
        transactionRepository.save(InventoryTransaction.builder()
                .inventoryItem(source)
                .type(InventoryTransactionType.TRANSFER_OUT)
                .quantity(-request.getQuantity())
                .notes(request.getNotes())
                .build());

        // Add to destination branch
        Product product = source.getProduct();
        InventoryItem destination = inventoryItemRepository
                .findByProductIdAndBranchId(request.getProductId(), request.getToBranchId())
                .orElseGet(() -> InventoryItem.builder()
                        .product(product)
                        .branchId(request.getToBranchId())
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        destination.setQuantity(destination.getQuantity() + request.getQuantity());
        InventoryItem savedDest = inventoryItemRepository.save(destination);
        transactionRepository.save(InventoryTransaction.builder()
                .inventoryItem(savedDest)
                .type(InventoryTransactionType.TRANSFER_IN)
                .quantity(request.getQuantity())
                .notes(request.getNotes())
                .build());
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public InventoryItemDTO getStockByProductAndBranch(UUID productId, UUID branchId) {
        return inventoryItemRepository.findByProductIdAndBranchId(productId, branchId)
                .map(this::toItemDTO)
                .orElseThrow(() -> new IllegalArgumentException("Stock record not found for given product and branch."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemDTO> getStockByBranch(UUID branchId) {
        return inventoryItemRepository.findByBranchId(branchId)
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemDTO> getLowStock(UUID branchId, int threshold) {
        return inventoryItemRepository.findLowStockByBranch(branchId, threshold)
                .stream().map(this::toItemDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransactionDTO> getTransactionsByBranch(UUID branchId, Pageable pageable) {
        return transactionRepository.findByInventoryItemBranchId(branchId, pageable)
                .map(this::toTransactionDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransactionDTO> getTransactionsByProduct(UUID productId, Pageable pageable) {
        return transactionRepository.findByInventoryItemProductId(productId, pageable)
                .map(this::toTransactionDTO);
    }

    // ── Mapper helpers ────────────────────────────────────────────────────────

    private InventoryItemDTO toItemDTO(InventoryItem item) {
        return InventoryItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productSku(item.getProduct().getSku())
                .branchId(item.getBranchId())
                .quantity(item.getQuantity())
                .reservedQuantity(item.getReservedQuantity())
                .availableQuantity(item.getAvailableQuantity())
                .rackLocation(item.getRackLocation())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private InventoryTransactionDTO toTransactionDTO(InventoryTransaction tx) {
        return InventoryTransactionDTO.builder()
                .id(tx.getId())
                .inventoryItemId(tx.getInventoryItem().getId())
                .productId(tx.getInventoryItem().getProduct().getId())
                .productName(tx.getInventoryItem().getProduct().getName())
                .branchId(tx.getInventoryItem().getBranchId())
                .type(tx.getType())
                .quantity(tx.getQuantity())
                .referenceId(tx.getReferenceId())
                .notes(tx.getNotes())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
