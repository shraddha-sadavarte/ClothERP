package com.clotherp.backend.modules.accounting;

import com.clotherp.backend.common.ApiResponse;
import com.clotherp.backend.modules.sales.SalesOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounting")
@RequiredArgsConstructor
public class AccountingController {

    private final AccountingService accountingService;
    private final com.clotherp.backend.modules.sales.SalesOrderRepository salesOrderRepository;

    @GetMapping("/chart-of-accounts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getChartOfAccounts() {
        List<AccountDTO> accounts = accountingService.getChartOfAccounts();
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @GetMapping("/journal-entries")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<JournalEntryDTO>>> getJournalEntries() {
        List<JournalEntryDTO> entries = accountingService.getJournalEntries();
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @GetMapping("/income-statement")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<IncomeStatementDTO>> getIncomeStatement() {
        IncomeStatementDTO statement = accountingService.getIncomeStatement();
        return ResponseEntity.ok(ApiResponse.ok(statement));
    }

    @PostMapping("/post-sales-journal")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','OWNER')")
    public ResponseEntity<ApiResponse<Void>> postSalesJournalEntry(@RequestBody UUID salesOrderId) {
        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new IllegalArgumentException("SalesOrder not found: " + salesOrderId));
        accountingService.postSalesJournalEntry(salesOrder);
        return ResponseEntity.ok(ApiResponse.ok(null, "Sales journal entry posted"));
    }
}
