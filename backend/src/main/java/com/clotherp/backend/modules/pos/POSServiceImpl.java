package com.clotherp.backend.modules.pos;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.modules.customer.Customer;
import com.clotherp.backend.modules.customer.CustomerRepository;
import com.clotherp.backend.modules.inventory.InventoryItem;
import com.clotherp.backend.modules.inventory.InventoryItemRepository;
import com.clotherp.backend.modules.inventory.InventoryTransactionType;
import com.clotherp.backend.modules.product.Product;
import com.clotherp.backend.modules.product.ProductRepository;
import com.clotherp.backend.modules.sales.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class POSServiceImpl implements POSService {

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final SalesOrderService salesOrderService;

    @Override
    @Transactional(readOnly = true)
    public List<ProductSearchDTO> searchProducts(String search) {
        List<Product> products;
        if (search == null || search.trim().isEmpty()) {
            products = productRepository.findAll();
        } else {
            // You'll need to add custom search method to ProductRepository
            products = productRepository.findByNameContainingOrSkuContaining(search, search);
        }
        return products.stream()
                .map(this::toProductSearchDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SalesOrderDTO processCheckout(POSCheckoutRequest request) {
        // Validate branch
        if (request.getBranchId() == null) {
            throw new BusinessException("Branch ID is required");
        }

        // Build sales order request
        CreateSalesOrderRequest orderRequest = CreateSalesOrderRequest.builder()
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .items(request.getItems().stream()
                        .map(item -> CreateSaleItemRequest.builder()
                                .productId(item.getProductId())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .discountPercent(item.getDiscountPercent())
                                .build())
                        .collect(Collectors.toList()))
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .paymentMethod(request.getPaymentMethod())
                .build();

        // Create the order using existing service
        SalesOrderDTO order = salesOrderService.createOrder(orderRequest);

        // Deduct stock from inventory (if product inventory is tracked)
        for (POSCheckoutItem item : request.getItems()) {
            InventoryItem inventoryItem = inventoryItemRepository
                    .findByProductIdAndBranchId(item.getProductId(), request.getBranchId())
                    .orElseThrow(() -> new BusinessException("Product not found in inventory for this branch"));

            if (inventoryItem.getAvailableQuantity() < item.getQuantity()) {
                throw new BusinessException("Insufficient stock for product ID: " + item.getProductId());
            }

            // Deduct quantity
            inventoryItem.setQuantity(inventoryItem.getQuantity() - item.getQuantity());
            inventoryItemRepository.save(inventoryItem);
        }

        return order;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSearchDTO> searchCustomers(String search) {
        List<Customer> customers;
        if (search == null || search.trim().isEmpty()) {
            customers = customerRepository.findAll();
        } else {
            customers = customerRepository
                    .findByFullNameContainingIgnoreCaseOrPhoneContaining(search, search);
        }
        return customers.stream()
                .map(this::toCustomerSearchDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public POSSessionDTO getCurrentSession() {
        // For now, return a simple session object
        // You can extend this to track register sessions, cash counts, etc.
        return POSSessionDTO.builder()
                .sessionId("POS-" + System.currentTimeMillis())
                .startedAt(LocalDateTime.now())
                .status("ACTIVE")
                .build();
    }

    // ── Mappers ──

    private ProductSearchDTO toProductSearchDTO(Product product) {
        return ProductSearchDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .price(product.getPrice())
                .build();
    }

    private CustomerSearchDTO toCustomerSearchDTO(Customer customer) {
        return CustomerSearchDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .loyaltyPoints(customer.getLoyaltyPoints())
                .build();
    }
}