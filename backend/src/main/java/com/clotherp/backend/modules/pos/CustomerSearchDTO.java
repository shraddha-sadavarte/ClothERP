package com.clotherp.backend.modules.pos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSearchDTO {
    private UUID id;
    private String fullName;
    private String phone;
    private int loyaltyPoints;
}