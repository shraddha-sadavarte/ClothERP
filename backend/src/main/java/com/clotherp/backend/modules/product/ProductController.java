package com.clotherp.backend.modules.product;

import com.clotherp.backend.common.ApiResponse;
import com.clotherp.backend.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * POST /api/v1/products
     * Create a new product. Requires ADMIN or MANAGER role.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductDTO>> createProduct(@Valid @RequestBody ProductDTO request) {
        // If user is superadmin, use the branch from request; otherwise use user's branch
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
        if (request.getBranchId() == null) {
            request.setBranchId(userPrincipal.getBranchId());
        }
        // Validate that the user can create for that branch
        boolean isSuperAdmin = userPrincipal.getAuthorities().stream().anyMatch(g -> g.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (!isSuperAdmin && !userPrincipal.getBranchId().equals(request.getBranchId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create product for another branch");
        }
        ProductDTO created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Product created successfully"));
    }

    /**
     * GET /api/v1/products
     * List all products with pagination. All authenticated users can access.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getAllProducts(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable,
            @RequestParam(required = false) UUID branchId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
        boolean isSuperAdmin = userPrincipal.getAuthorities().stream()
                .anyMatch(g -> g.getAuthority().equals("ROLE_SUPER_ADMIN"));

        UUID effectiveBranchId = branchId;
        if (effectiveBranchId == null && !isSuperAdmin) {
            effectiveBranchId = userPrincipal.getBranchId();
        }
        // if superadmin and no branchId provided, return all products (or filter by selected branch)
        Page<ProductDTO> products = productService.getAllProducts(pageable, effectiveBranchId);
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    /**
     * GET /api/v1/products/{id}
     * Get product by UUID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    /**
     * GET /api/v1/products/sku/{sku}
     * Get product by SKU code.
     */
    @GetMapping("/sku/{sku}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProductBySku(@PathVariable String sku) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductBySku(sku)));
    }

    /**
     * PUT /api/v1/products/{id}
     * Update a product. Requires ADMIN or MANAGER role.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductDTO request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.updateProduct(id, request), "Product updated successfully"));
    }

    /**
     * DELETE /api/v1/products/{id}
     * Soft-delete a product. Requires ADMIN role only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product deleted successfully"));
    }
}
