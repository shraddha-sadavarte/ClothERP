package com.clotherp.backend.common;

import java.util.Set;

/**
 * Central place for role -> permission mapping. Kept as a static enum lookup
 * rather than a `roles`/`permissions` DB table for now — the design doc's
 * core.roles table is the long-term version of this, but that requires
 * migrating User.role from a String column to a foreign key, which is a
 * bigger change than was asked for here. If you later need per-tenant or
 * per-user custom permissions (not just per-role), move this into the DB.
 */
public enum Role {

    SUPER_ADMIN(Set.of(Permission.ALL)),
    OWNER(Set.of(Permission.ALL)),

    BRANCH_MANAGER(Set.of(
            Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE,
            Permission.SALES_VIEW, Permission.SALES_CREATE,
            Permission.USER_VIEW
    )),
    SALES_EXECUTIVE(Set.of(
            Permission.SALES_VIEW, Permission.SALES_CREATE, Permission.POS_BILLING
    )),
    CASHIER(Set.of(
            Permission.POS_BILLING, Permission.PAYMENT_COLLECT
    )),
    PURCHASE_MANAGER(Set.of(
            Permission.PURCHASE_VIEW, Permission.PURCHASE_CREATE, Permission.SUPPLIER_MANAGE
    )),
    WAREHOUSE_MANAGER(Set.of(
            Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST, Permission.TRANSFER_MANAGE
    )),
    ACCOUNTANT(Set.of(
            Permission.ACCOUNTING_VIEW, Permission.ACCOUNTING_CREATE, Permission.GST_MANAGE
    ));

    private final Set<Permission> permissions;

    Role(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public enum Permission {
        ALL,
        PRODUCT_VIEW, PRODUCT_CREATE,
        SALES_VIEW, SALES_CREATE,
        USER_VIEW,
        POS_BILLING, PAYMENT_COLLECT,
        PURCHASE_VIEW, PURCHASE_CREATE, SUPPLIER_MANAGE,
        INVENTORY_VIEW, INVENTORY_ADJUST, TRANSFER_MANAGE,
        ACCOUNTING_VIEW, ACCOUNTING_CREATE, GST_MANAGE
    }
}