package com.clotherp.backend.modules.inventory;

import com.clotherp.backend.common.BaseEntity;
import com.clotherp.backend.modules.product.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;

import java.util.UUID;

@Entity
@Table(
    name = "inventory_items",
    uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "branch_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private int reservedQuantity = 0;

    @Column(name = "rack_location")
    private String rackLocation;

    @Version
    private Integer version;   // ✅ Add optimistic locking

    @Transient
    public int getAvailableQuantity() {
        return quantity - reservedQuantity;
    }
}