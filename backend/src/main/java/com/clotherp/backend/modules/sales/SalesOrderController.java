package com.clotherp.backend.modules.sales;

import com.clotherp.backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<Page<SalesOrderDTO>>> getAllOrders(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SalesOrderDTO> page = salesOrderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrderById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> createOrder(@Valid @RequestBody CreateSalesOrderRequest request) {
        SalesOrderDTO dto = salesOrderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto, "Order created"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        SalesOrderDTO dto = salesOrderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(dto, "Order status updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(@PathVariable UUID id) {
        salesOrderService.cancelOrder(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Order cancelled successfully"));
    }
}