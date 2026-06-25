package com.clotherp.backend.modules.customer;

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
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<List<Customer>>> searchCustomers(@RequestParam(required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.searchCustomers(query)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@Valid @RequestBody Customer customer) {
        Customer created = customerService.createCustomer(customer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created, "Customer created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER', 'SALES_EXECUTIVE')")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(@PathVariable UUID id, @Valid @RequestBody Customer customer) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.updateCustomer(id, customer), "Customer updated successfully"));
    }
}