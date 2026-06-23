package com.clotherp.backend.modules.user;

import com.clotherp.backend.common.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private UUID branchId;
    private Role role;
    private Boolean active;
}
