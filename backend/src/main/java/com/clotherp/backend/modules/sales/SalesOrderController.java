package com.clotherp.backend.modules.sales;

import java.util.List;
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
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    public ResponseEntity<List<SalesOrderDTO>> getAllOrders() {
        return ResponseEntity.ok(salesOrderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesOrderDTO> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(salesOrderService.getOrderById(id));
    }

    @PostMapping
    public ResponseEntity<SalesOrderDTO> createOrder(@Valid @RequestBody CreateSalesOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderService.createOrder(request));
    }
}
