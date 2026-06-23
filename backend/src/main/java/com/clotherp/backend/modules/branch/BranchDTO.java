package com.clotherp.backend.modules.branch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDTO {
    private UUID id;
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private String pinCode;
    private String phone;
    private boolean active;
}
