package com.clotherp.backend.modules.inventory;

public enum InventoryTransactionType {
    STOCK_IN,         // New stock received (purchase order)
    STOCK_OUT,        // Stock sold / dispatched
    TRANSFER_IN,      // Stock received from another branch
    TRANSFER_OUT,     // Stock sent to another branch
    ADJUSTMENT        // Manual correction (damaged goods, count mismatch)
}
