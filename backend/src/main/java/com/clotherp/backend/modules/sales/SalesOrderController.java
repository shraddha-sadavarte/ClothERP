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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/sales")   // note: I changed from "/api/sales" to "/api/v1/sales" to match frontend
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SalesOrderDTO>>> getAllOrders(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SalesOrderDTO> page = salesOrderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesOrderDTO>> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(salesOrderService.getOrderById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SalesOrderDTO>> createOrder(@Valid @RequestBody CreateSalesOrderRequest request) {
        SalesOrderDTO dto = salesOrderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto, "Order created"));
    }
}