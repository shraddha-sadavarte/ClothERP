package com.clotherp.backend.modules.branch;

import com.clotherp.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    /** List all active branches — publicly accessible for the registration dropdown. */
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<BranchDTO>>> getAllBranches() {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getAllActiveBranches()));
    }

    /** Get branch by ID */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BranchDTO>> getBranchById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getBranchById(id)));
    }

    /** Create a new branch — SUPER_ADMIN or OWNER only */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<BranchDTO>> createBranch(@Valid @RequestBody BranchDTO dto) {
        BranchDTO created = branchService.createBranch(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created, "Branch created successfully"));
    }

    /** Update a branch — SUPER_ADMIN or OWNER only */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<BranchDTO>> updateBranch(
            @PathVariable UUID id, @Valid @RequestBody BranchDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.updateBranch(id, dto), "Branch updated successfully"));
    }

    /** Soft-deactivate a branch — SUPER_ADMIN or ADMIN only */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateBranch(@PathVariable UUID id) {
        branchService.deactivateBranch(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Branch deactivated successfully"));
    }
}
