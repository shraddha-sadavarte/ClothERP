package com.clotherp.backend.modules.user;

import com.clotherp.backend.common.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID id;
    private String username;
    private String email;
    private Role role;
    private UUID branchId;
    private boolean active;
    // Included so the frontend can do permission-gated UI (show/hide buttons)
    // without having to hardcode the role -> permission table client-side.
    private Set<Role.Permission> permissions;

    public static UserDTO fromEntity(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .branchId(user.getBranchId())
                .active(user.isActive())
                .permissions(user.getRole().getPermissions())
                .build();
    }
}