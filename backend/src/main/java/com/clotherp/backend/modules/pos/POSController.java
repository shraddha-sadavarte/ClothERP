package com.clotherp.backend.modules.pos;

import com.clotherp.backend.common.ApiResponse;
import com.clotherp.backend.modules.sales.SalesOrderDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.clotherp.backend.security.UserPrincipal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','OWNER','BRANCH_MANAGER','SALES_EXECUTIVE','CASHIER')")
public class POSController {

    private final POSService posService;

    /**
     * GET /api/v1/pos/products?search=...
     * Search products for POS – returns only essential fields.
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductSearchDTO>>> searchProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID branchId) {
        if (branchId == null) {
            branchId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getBranchId();
        }
        return ResponseEntity.ok(ApiResponse.ok(posService.searchProducts(search, branchId)));
    }

    /**
     * POST /api/v1/pos/checkout
     * Process a POS order (creates sales order and updates inventory).
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> checkout(
            @Valid @RequestBody POSCheckoutRequest request) {
        SalesOrderDTO order = posService.processCheckout(request);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order completed successfully"));
    }

    /**
     * GET /api/v1/pos/customers?search=...
     * Search customers for POS.
     */
    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<CustomerSearchDTO>>> searchCustomers(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(posService.searchCustomers(search)));
    }

    /**
     * GET /api/v1/pos/sessions
     * Get current POS session / register status.
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<POSSessionDTO>> getSession() {
        return ResponseEntity.ok(ApiResponse.ok(posService.getCurrentSession()));
    }
}