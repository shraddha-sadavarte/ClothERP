package com.clotherp.backend.modules.sales;

/**
 * Represents the lifecycle stages of a SalesOrder.
 *
 * Valid transitions:
 *   DRAFT → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
 *                                             ↘ CANCELLED
 *   CONFIRMED → CANCELLED
 */
public enum SalesOrderStatus {
    DRAFT,       // Created but stock is NOT yet reserved
    CONFIRMED,   // Customer confirmed; stock IS reserved
    PROCESSING,  // Order is being packed/prepared
    SHIPPED,     // Goods dispatched; reserved stock IS deducted
    DELIVERED,   // Completed and received by customer
    CANCELLED    // Cancelled; reserved stock IS released
}
