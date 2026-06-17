package com.clotherp.backend.modules.user;

import com.clotherp.backend.common.ApiResponse;
import com.clotherp.backend.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserDTO> userPage = userService.getAllUsers(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(userPage)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<UserDTO>> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
    }
}