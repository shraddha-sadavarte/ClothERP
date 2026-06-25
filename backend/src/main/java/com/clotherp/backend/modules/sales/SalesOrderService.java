package com.clotherp.backend.modules.sales;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.common.ResourceNotFoundException;
import com.clotherp.backend.modules.product.Product;
import com.clotherp.backend.modules.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<SalesOrderDTO> getAllOrders(Pageable pageable) {
        return salesOrderRepository.findAllWithItemsAndProducts(pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public SalesOrderDTO getOrderById(UUID id) {
        SalesOrder order = salesOrderRepository.findByIdWithItemsAndProducts(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", id));
        return mapToDTO(order);
    }

    public SalesOrderDTO createOrder(CreateSalesOrderRequest request) {
        // Build the order
        SalesOrder order = SalesOrder.builder()
                .orderNumber("SO-" + System.currentTimeMillis())
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .status(SalesOrderStatus.DRAFT)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .shippingAddress(request.getShippingAddress())
                .notes(request.getNotes())
                .build();

        // Map items
        List<SaleItem> items = request.getItems().stream().map(reqItem -> {
            Product product = productRepository.findById(reqItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", reqItem.getProductId()));

            BigDecimal unitPrice = reqItem.getUnitPrice();
            int quantity = reqItem.getQuantity();
            BigDecimal discountPercent = reqItem.getDiscountPercent() != null ? reqItem.getDiscountPercent() : BigDecimal.ZERO;
            BigDecimal discountMultiplier = BigDecimal.ONE.subtract(discountPercent.divide(BigDecimal.valueOf(100), 4, BigDecimal.ROUND_HALF_UP));
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).multiply(discountMultiplier);

            return SaleItem.builder()
                    .salesOrder(order)
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .discountPercent(discountPercent)
                    .lineTotal(lineTotal)
                    .build();
        }).collect(Collectors.toList());

        order.setItems(items);

        // Compute totals
        BigDecimal subtotal = items.stream()
                .map(SaleItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setSubtotal(subtotal);

        BigDecimal total = subtotal.subtract(order.getDiscountAmount()).add(order.getTaxAmount());
        order.setTotalAmount(total);

        // Save
        SalesOrder savedOrder = salesOrderRepository.save(order);
        return mapToDTO(savedOrder);
    }

    public SalesOrderDTO updateOrderStatus(UUID id, UpdateOrderStatusRequest request) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", id));

        // Validate status transition
        if (order.getStatus() == SalesOrderStatus.DELIVERED || order.getStatus() == SalesOrderStatus.CANCELLED) {
            throw new BusinessException("Cannot change status of a " + order.getStatus() + " order");
        }

        // If transitioning from DRAFT to CONFIRMED, we should reserve stock (future feature)
        // For now, just update status
        order.setStatus(request.getStatus());
        SalesOrder updated = salesOrderRepository.save(order);
        return mapToDTO(updated);
    }

    public void cancelOrder(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", id));

        if (order.getStatus() == SalesOrderStatus.DELIVERED) {
            throw new BusinessException("Delivered orders cannot be cancelled");
        }

        order.setStatus(SalesOrderStatus.CANCELLED);
        salesOrderRepository.save(order);
        // If stock was reserved (CONFIRMED or higher), we should release it (future feature)
    }

    // ── Mapping helpers ──

    private SalesOrderDTO mapToDTO(SalesOrder order) {
        SalesOrderDTO.SalesOrderDTOBuilder builder = SalesOrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomerId())
                .branchId(order.getBranchId())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt());

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            List<SaleItemDTO> itemDTOs = order.getItems().stream()
                    .map(item -> SaleItemDTO.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productSku(item.getProduct().getSku())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .discountPercent(item.getDiscountPercent())
                            .lineTotal(item.getLineTotal())
                            .build())
                    .collect(Collectors.toList());
            builder.items(itemDTOs);
        }

        return builder.build();
    }
}