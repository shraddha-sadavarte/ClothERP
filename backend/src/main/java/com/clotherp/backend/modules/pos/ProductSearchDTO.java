package com.clotherp.backend.modules.pos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchDTO {
    private UUID id;
    private String name;
    private String sku;
    private BigDecimal price;
}