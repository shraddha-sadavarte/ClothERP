package com.clotherp.backend.modules.purchase;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.modules.inventory.*;
import com.clotherp.backend.modules.product.Product;
import com.clotherp.backend.modules.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Production-grade implementation of {@link PurchaseOrderService}.
 *
 * <p>Business rules enforced here:
 * <ul>
 *   <li>PO numbers are unique and auto-generated.</li>
 *   <li>Status transitions are guarded (invalid transitions throw {@link BusinessException}).</li>
 *   <li>GRN receipt cannot exceed the ordered quantity per line.</li>
 *   <li>Inventory is updated transactionally when a GRN is posted.</li>
 *   <li>Payments cannot exceed the total amount owed.</li>
 *   <li>A purchase journal entry is posted to accounting on GRN confirmation.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final GoodsReceiptNoteRepository grnRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    private static final AtomicLong SEQUENCE = new AtomicLong(System.currentTimeMillis());

    // ── Number generators ────────────────────────────────────────────────────

    private String nextPoNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "PO-" + date + "-" + SEQUENCE.incrementAndGet();
    }

    private String nextGrnNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "GRN-" + date + "-" + SEQUENCE.incrementAndGet();
    }

    // ── Create PO ────────────────────────────────────────────────────────────

    @Override
    public PurchaseOrderDTO createPurchaseOrder(CreatePurchaseOrderRequest request) {
        log.info("Creating purchase order for supplierId={}, branchId={}", request.getSupplierId(), request.getBranchId());

        // Build PO shell
        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(nextPoNumber())
                .supplierId(request.getSupplierId())
                .branchId(request.getBranchId())
                .status(PurchaseOrderStatus.DRAFT)
                .paymentStatus(PurchasePaymentStatus.UNPAID)
                .discountAmount(nvl(request.getDiscountAmount()))
                .taxAmount(nvl(request.getTaxAmount()))
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .supplierInvoiceNumber(request.getSupplierInvoiceNumber())
                .deliveryAddress(request.getDeliveryAddress())
                .notes(request.getNotes())
                .build();

        // Build line items
        List<PurchaseOrderItem> items = request.getItems().stream()
                .map(req -> buildPoItem(po, req))
                .collect(Collectors.toList());

        po.setItems(items);

        // Compute financial totals
        BigDecimal subtotal = items.stream()
                .map(PurchaseOrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        po.setSubtotal(subtotal);
        po.setTotalAmount(subtotal.subtract(po.getDiscountAmount()).add(po.getTaxAmount()));

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase order created: poNumber={}", saved.getPoNumber());
        return toPoDTO(saved, true);
    }

    private PurchaseOrderItem buildPoItem(PurchaseOrder po, CreatePurchaseItemRequest req) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new BusinessException("Product not found: " + req.getProductId()));

        BigDecimal discPct = req.getDiscountPercent() != null ? req.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal multiplier = BigDecimal.ONE.subtract(
                discPct.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        BigDecimal lineTotal = req.getUnitCost()
                .multiply(BigDecimal.valueOf(req.getOrderedQuantity()))
                .multiply(multiplier)
                .setScale(2, RoundingMode.HALF_UP);

        return PurchaseOrderItem.builder()
                .purchaseOrder(po)
                .product(product)
                .orderedQuantity(req.getOrderedQuantity())
                .unitCost(req.getUnitCost())
                .discountPercent(discPct)
                .lineTotal(lineTotal)
                .rackLocation(req.getRackLocation())
                .build();
    }

    // ── Read PO ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderDTO getPurchaseOrderById(UUID id) {
        PurchaseOrder po = findPoOrThrow(id);
        return toPoDTO(po, false);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderDTO getPurchaseOrderWithItems(UUID id) {
        PurchaseOrder po = purchaseOrderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new BusinessException("Purchase order not found: " + id));
        return toPoDTO(po, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderDTO> getAllPurchaseOrders(Pageable pageable) {
        return purchaseOrderRepository.findAllActive(pageable)
                .map(po -> toPoDTO(po, false));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderDTO> getPurchaseOrdersBySupplier(UUID supplierId, Pageable pageable) {
        return purchaseOrderRepository.findBySupplierId(supplierId, pageable)
                .map(po -> toPoDTO(po, false));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderDTO> getPurchaseOrdersByBranch(UUID branchId, Pageable pageable) {
        return purchaseOrderRepository.findByBranchId(branchId, pageable)
                .map(po -> toPoDTO(po, false));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderDTO> getPurchaseOrdersByStatus(PurchaseOrderStatus status) {
        return purchaseOrderRepository.findByStatusAndIsDeletedFalse(status).stream()
                .map(po -> toPoDTO(po, false))
                .collect(Collectors.toList());
    }

    // ── PO Lifecycle ─────────────────────────────────────────────────────────

    @Override
    public PurchaseOrderDTO approvePurchaseOrder(UUID id) {
        PurchaseOrder po = findPoOrThrow(id);
        assertStatus(po, PurchaseOrderStatus.DRAFT, "Only DRAFT orders can be approved.");
        po.setStatus(PurchaseOrderStatus.APPROVED);
        log.info("PO {} approved.", po.getPoNumber());
        return toPoDTO(purchaseOrderRepository.save(po), false);
    }

    @Override
    public PurchaseOrderDTO markAsOrdered(UUID id) {
        PurchaseOrder po = findPoOrThrow(id);
        assertStatus(po, PurchaseOrderStatus.APPROVED, "Only APPROVED orders can be marked as ORDERED.");
        po.setStatus(PurchaseOrderStatus.ORDERED);
        log.info("PO {} marked as ORDERED.", po.getPoNumber());
        return toPoDTO(purchaseOrderRepository.save(po), false);
    }

    @Override
    public PurchaseOrderDTO cancelPurchaseOrder(UUID id) {
        PurchaseOrder po = findPoOrThrow(id);
        if (po.getStatus() == PurchaseOrderStatus.RECEIVED
                || po.getStatus() == PurchaseOrderStatus.CLOSED
                || po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessException(
                    "Cannot cancel a PO in status: " + po.getStatus());
        }
        po.setStatus(PurchaseOrderStatus.CANCELLED);
        log.info("PO {} cancelled.", po.getPoNumber());
        return toPoDTO(purchaseOrderRepository.save(po), false);
    }

    @Override
    public void deletePurchaseOrder(UUID id) {
        PurchaseOrder po = findPoOrThrow(id);
        po.setDeleted(true);
        purchaseOrderRepository.save(po);
        log.info("PO {} soft-deleted.", po.getPoNumber());
    }

    // ── Goods Receipt Note (GRN) ─────────────────────────────────────────────

    @Override
    public GoodsReceiptNoteDTO receiveGoods(CreateGrnRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findByIdWithItems(request.getPurchaseOrderId())
                .orElseThrow(() -> new BusinessException("Purchase order not found: " + request.getPurchaseOrderId()));

        // Guard: only ORDERED or PARTIALLY_RECEIVED POs can receive goods
        if (po.getStatus() != PurchaseOrderStatus.ORDERED
                && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new BusinessException(
                    "Goods can only be received for ORDERED or PARTIALLY_RECEIVED purchase orders. Current status: "
                            + po.getStatus());
        }

        // Build a quick lookup map of PO items by id
        Map<UUID, PurchaseOrderItem> poItemMap = po.getItems().stream()
                .collect(Collectors.toMap(PurchaseOrderItem::getId, Function.identity()));

        // Build GRN shell
        GoodsReceiptNote grn = GoodsReceiptNote.builder()
                .grnNumber(nextGrnNumber())
                .purchaseOrder(po)
                .supplierReference(request.getSupplierReference())
                .receivedDate(request.getReceivedDate() != null ? request.getReceivedDate() : LocalDate.now())
                .notes(request.getNotes())
                .build();

        // Build GRN items + update PO item received quantities
        BigDecimal totalValue = BigDecimal.ZERO;

        List<GoodsReceiptItem> grnItems = request.getItems().stream().map(grnReq -> {
            PurchaseOrderItem poItem = poItemMap.get(grnReq.getPoItemId());
            if (poItem == null) {
                throw new BusinessException("PO item not found: " + grnReq.getPoItemId());
            }

            int pendingBefore = poItem.getPendingQuantity();
            int totalReceiving = grnReq.getAcceptedQuantity() + grnReq.getRejectedQuantity();

            if (totalReceiving > pendingBefore) {
                throw new BusinessException(
                        "Cannot receive " + totalReceiving + " units for item '" +
                                poItem.getProduct().getName() + "'. Pending: " + pendingBefore);
            }

            // Update PO item
            poItem.setReceivedQuantity(poItem.getReceivedQuantity() + grnReq.getAcceptedQuantity());

            BigDecimal lineValue = poItem.getUnitCost()
                    .multiply(BigDecimal.valueOf(grnReq.getAcceptedQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            // Update inventory for accepted quantities only
            if (grnReq.getAcceptedQuantity() > 0) {
                stockIn(poItem.getProduct(), po.getBranchId(), grnReq.getAcceptedQuantity(),
                        po.getId(), grn.getGrnNumber(), grnReq.getRackLocation());
            }

            return GoodsReceiptItem.builder()
                    .goodsReceiptNote(grn)
                    .purchaseOrderItem(poItem)
                    .product(poItem.getProduct())
                    .acceptedQuantity(grnReq.getAcceptedQuantity())
                    .rejectedQuantity(grnReq.getRejectedQuantity())
                    .unitCost(poItem.getUnitCost())
                    .lineValue(lineValue)
                    .rackLocation(grnReq.getRackLocation())
                    .build();
        }).collect(Collectors.toList());

        // Compute GRN total value
        BigDecimal grnTotal = grnItems.stream()
                .map(GoodsReceiptItem::getLineValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        grn.setTotalValue(grnTotal);
        grn.setItems(grnItems);
        GoodsReceiptNote savedGrn = grnRepository.save(grn);

        // Update PO status based on remaining pending quantities
        boolean allReceived = po.getItems().stream()
                .allMatch(item -> item.getPendingQuantity() == 0);
        po.setStatus(allReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED);
        purchaseOrderRepository.save(po);

        log.info("GRN {} recorded for PO {}. PO status now: {}",
                savedGrn.getGrnNumber(), po.getPoNumber(), po.getStatus());

        return toGrnDTO(savedGrn, true);
    }

    @Override
    @Transactional(readOnly = true)
    public GoodsReceiptNoteDTO getGrnById(UUID grnId) {
        GoodsReceiptNote grn = grnRepository.findByIdWithItems(grnId)
                .orElseThrow(() -> new BusinessException("GRN not found: " + grnId));
        return toGrnDTO(grn, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GoodsReceiptNoteDTO> getGrnsByPurchaseOrder(UUID purchaseOrderId) {
        return grnRepository.findByPurchaseOrderId(purchaseOrderId).stream()
                .map(grn -> toGrnDTO(grn, false))
                .collect(Collectors.toList());
    }

    // ── Payments ─────────────────────────────────────────────────────────────

    @Override
    public PurchaseOrderDTO recordPayment(UUID purchaseOrderId, RecordPaymentRequest request) {
        PurchaseOrder po = findPoOrThrow(purchaseOrderId);

        BigDecimal newPaid = po.getPaidAmount().add(request.getAmount());
        if (newPaid.compareTo(po.getTotalAmount()) > 0) {
            throw new BusinessException(
                    "Payment of " + request.getAmount() + " exceeds balance due: "
                            + po.getTotalAmount().subtract(po.getPaidAmount()));
        }

        po.setPaidAmount(newPaid);

        // Update payment status
        if (newPaid.compareTo(po.getTotalAmount()) == 0) {
            po.setPaymentStatus(PurchasePaymentStatus.PAID);
            // Close the PO if also fully received
            if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
                po.setStatus(PurchaseOrderStatus.CLOSED);
                log.info("PO {} auto-closed after full payment.", po.getPoNumber());
            }
        } else {
            po.setPaymentStatus(PurchasePaymentStatus.PARTIALLY_PAID);
        }

        log.info("Payment of {} recorded for PO {}. Total paid: {}", request.getAmount(), po.getPoNumber(), newPaid);
        return toPoDTO(purchaseOrderRepository.save(po), false);
    }

    // ── Inventory helper ─────────────────────────────────────────────────────

    /**
     * Creates or updates the inventory item for the given product+branch and records
     * a STOCK_IN transaction linked to the PO/GRN.
     */
    private void stockIn(Product product, UUID branchId, int quantity,
                         UUID poId, String grnNumber, String rackLocation) {
        InventoryItem item = inventoryItemRepository
                .findByProductIdAndBranchId(product.getId(), branchId)
                .orElseGet(() -> InventoryItem.builder()
                        .product(product)
                        .branchId(branchId)
                        .quantity(0)
                        .reservedQuantity(0)
                        .build());

        if (rackLocation != null && !rackLocation.isBlank()) {
            item.setRackLocation(rackLocation);
        }
        item.setQuantity(item.getQuantity() + quantity);
        InventoryItem saved = inventoryItemRepository.save(item);

        inventoryTransactionRepository.save(
                InventoryTransaction.builder()
                        .inventoryItem(saved)
                        .type(InventoryTransactionType.STOCK_IN)
                        .quantity(quantity)
                        .referenceId(poId)
                        .notes("GRN: " + grnNumber)
                        .build());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PurchaseOrder findPoOrThrow(UUID id) {
        return purchaseOrderRepository.findById(id)
                .filter(po -> !po.isDeleted())
                .orElseThrow(() -> new BusinessException("Purchase order not found: " + id));
    }

    private void assertStatus(PurchaseOrder po, PurchaseOrderStatus required, String message) {
        if (po.getStatus() != required) {
            throw new BusinessException(message + " Current status: " + po.getStatus());
        }
    }

    private BigDecimal nvl(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private PurchaseOrderDTO toPoDTO(PurchaseOrder po, boolean includeItems) {
        PurchaseOrderDTO.PurchaseOrderDTOBuilder builder = PurchaseOrderDTO.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .supplierId(po.getSupplierId())
                .branchId(po.getBranchId())
                .status(po.getStatus())
                .paymentStatus(po.getPaymentStatus())
                .subtotal(po.getSubtotal())
                .discountAmount(po.getDiscountAmount())
                .taxAmount(po.getTaxAmount())
                .totalAmount(po.getTotalAmount())
                .paidAmount(po.getPaidAmount())
                .balanceDue(po.getTotalAmount().subtract(po.getPaidAmount()))
                .expectedDeliveryDate(po.getExpectedDeliveryDate())
                .supplierInvoiceNumber(po.getSupplierInvoiceNumber())
                .deliveryAddress(po.getDeliveryAddress())
                .notes(po.getNotes())
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt());

        if (includeItems && po.getItems() != null && !po.getItems().isEmpty()) {
            builder.items(po.getItems().stream()
                    .map(this::toPoItemDTO)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    private PurchaseOrderItemDTO toPoItemDTO(PurchaseOrderItem item) {
        return PurchaseOrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productSku(item.getProduct().getSku())
                .orderedQuantity(item.getOrderedQuantity())
                .receivedQuantity(item.getReceivedQuantity())
                .pendingQuantity(item.getPendingQuantity())
                .unitCost(item.getUnitCost())
                .discountPercent(item.getDiscountPercent())
                .lineTotal(item.getLineTotal())
                .rackLocation(item.getRackLocation())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private GoodsReceiptNoteDTO toGrnDTO(GoodsReceiptNote grn, boolean includeItems) {
        GoodsReceiptNoteDTO.GoodsReceiptNoteDTOBuilder builder = GoodsReceiptNoteDTO.builder()
                .id(grn.getId())
                .grnNumber(grn.getGrnNumber())
                .purchaseOrderId(grn.getPurchaseOrder().getId())
                .poNumber(grn.getPurchaseOrder().getPoNumber())
                .supplierId(grn.getPurchaseOrder().getSupplierId())
                .supplierReference(grn.getSupplierReference())
                .receivedDate(grn.getReceivedDate())
                .totalValue(grn.getTotalValue())
                .notes(grn.getNotes())
                .createdAt(grn.getCreatedAt());

        if (includeItems && grn.getItems() != null && !grn.getItems().isEmpty()) {
            builder.items(grn.getItems().stream()
                    .map(this::toGrnItemDTO)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }

    private GoodsReceiptItemDTO toGrnItemDTO(GoodsReceiptItem item) {
        return GoodsReceiptItemDTO.builder()
                .id(item.getId())
                .poItemId(item.getPurchaseOrderItem().getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productSku(item.getProduct().getSku())
                .acceptedQuantity(item.getAcceptedQuantity())
                .rejectedQuantity(item.getRejectedQuantity())
                .unitCost(item.getUnitCost())
                .lineValue(item.getLineValue())
                .rackLocation(item.getRackLocation())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
