package com.clotherp.backend.modules.sales;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SalesOrderDTO {

    private UUID              id;
    private String            orderNumber;

    private UUID              customerId;
    private String            customerName;
    private String            customerMobile;

    private UUID              branchId;
    private String            branchName;

    private SalesOrderStatus  status;
    private String            statusLabel;

    private PaymentStatus     paymentStatus;
    private String            paymentStatusLabel;

    private BigDecimal        subtotal;
    private BigDecimal        discountAmount;
    private BigDecimal        taxAmount;
    private BigDecimal        totalAmount;
    private BigDecimal        paidAmount;
    private BigDecimal        balanceDue;

    private String            notes;
    private String            shippingAddress;

    private LocalDateTime     createdAt;
    private LocalDateTime     updatedAt;

    private List<SaleItemDTO> items;
}