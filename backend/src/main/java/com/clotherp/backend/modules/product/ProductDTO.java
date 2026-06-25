package com.clotherp.backend.modules.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private UUID id;
    private String name;
    private String sku;
    private String description;
    private BigDecimal price;
    private BigDecimal cost;
    private String category;
    private String size;
    private String color;
    private String material;
    private UUID branchId;       
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}