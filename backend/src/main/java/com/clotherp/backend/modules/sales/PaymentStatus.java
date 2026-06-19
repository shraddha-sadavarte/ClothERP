package com.clotherp.backend.modules.sales;

/**
 * Payment status of a SalesOrder, managed independently from order status.
 */
public enum PaymentStatus {
    PENDING,   // No payment received
    PARTIAL,   // Partial payment received
    PAID,      // Fully paid
    REFUNDED   // Payment returned to customer
}
