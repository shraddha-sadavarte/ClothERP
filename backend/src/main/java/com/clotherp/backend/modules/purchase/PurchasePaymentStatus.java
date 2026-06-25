package com.clotherp.backend.modules.purchase;

/**
 * Payment status of a purchase order / bill.
 */
public enum PurchasePaymentStatus {
    /** Payment has not yet been made. */
    UNPAID,

    /** Part of the invoice has been paid. */
    PARTIALLY_PAID,

    /** Invoice fully settled. */
    PAID
}
