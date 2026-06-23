package com.clotherp.backend.modules.sales;

import com.clotherp.backend.modules.product.Product;
import com.clotherp.backend.modules.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository; // needed to fetch Product entities

    public List<SalesOrderDTO> getAllOrders() {
        return salesOrderRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public SalesOrderDTO getOrderById(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return mapToDTO(order);
    }

    @Transactional
    public SalesOrderDTO createOrder(CreateSalesOrderRequest request) {
        // 1. Build the order (without items yet)
        SalesOrder order = SalesOrder.builder()
                .orderNumber("SO-" + System.currentTimeMillis())
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .status(SalesOrderStatus.DRAFT)
                .paymentStatus(PaymentStatus.PENDING)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .shippingAddress(request.getShippingAddress())
                .notes(request.getNotes())
                .build();

        // 2. Map items – fetch Product entities and build SaleItem list
        List<SaleItem> items = request.getItems().stream().map(reqItem -> {
            // Fetch the product to set the relationship
            Product product = productRepository.findById(reqItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + reqItem.getProductId()));

            // Compute line total: quantity * unitPrice * (1 - discountPercent/100)
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

        // 3. Compute order subtotal (sum of line totals)
        BigDecimal subtotal = items.stream()
                .map(SaleItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setSubtotal(subtotal);

        // 4. Compute final total
        BigDecimal total = subtotal.subtract(order.getDiscountAmount()).add(order.getTaxAmount());
        order.setTotalAmount(total);

        // 5. Save the order (cascade will save items)
        SalesOrder savedOrder = salesOrderRepository.save(order);
        return mapToDTO(savedOrder);
    }

    // ── Mapping helpers ──

    private SalesOrderDTO mapToDTO(SalesOrder order) {
        // Build the DTO using the builder (since @Builder exists on DTO)
        SalesOrderDTO.SalesOrderDTOBuilder builder = SalesOrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomerId())
                .branchId(order.getBranchId())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .shippingAddress(order.getShippingAddress())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt());

        // Map items (if any) – we can set them later, but we need to fetch product names/SKUs
        // For simplicity, we'll just map the items without product details, or we can fetch them.
        // Here we'll set a placeholder – you can enhance this later.
        // For now, we can set items as an empty list or map them.
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