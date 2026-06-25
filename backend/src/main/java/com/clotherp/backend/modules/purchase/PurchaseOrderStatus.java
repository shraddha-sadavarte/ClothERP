package com.clotherp.backend.modules.purchase;

/**
 * Lifecycle states for a Purchase Order.
 *
 * DRAFT     → APPROVED → ORDERED → PARTIALLY_RECEIVED → RECEIVED → CLOSED
 *                ↓                                                    ↑
 *            CANCELLED                                           (manually)
 */
public enum PurchaseOrderStatus {
    /** Created but not yet sent for approval. */
    DRAFT,

    /** Approved internally; ready to be sent to supplier. */
    APPROVED,

    /** Sent / confirmed with supplier. */
    ORDERED,

    /** Some items received, rest still pending. */
    PARTIALLY_RECEIVED,

    /** All items received in full. */
    RECEIVED,

    /** Order is fully closed (payment confirmed, books updated). */
    CLOSED,

    /** Cancelled before any goods were received. */
    CANCELLED
}
