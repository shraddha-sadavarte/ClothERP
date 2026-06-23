package com.clotherp.backend.modules.accounting;

import com.clotherp.backend.modules.sales.SaleItem;
import com.clotherp.backend.modules.sales.SalesOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountingServiceImpl implements AccountingService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalItemRepository journalItemRepository;

    private static final AtomicLong ENTRY_COUNTER = new AtomicLong(System.currentTimeMillis());

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Generate a unique journal entry number like JE-20240623-001 */
    private String nextEntryNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "JE-" + date + "-" + ENTRY_COUNTER.incrementAndGet();
    }

    private Account requireAccount(String code) {
        return accountRepository.findByCode(code)
                .orElseThrow(() -> new IllegalStateException(
                        "Account '" + code + "' not found. Please seed chart-of-accounts first."));
    }

    // -------------------------------------------------------------------------
    // postSalesJournalEntry
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public void postSalesJournalEntry(SalesOrder salesOrder) {
        // Avoid double-posting
        if (journalEntryRepository.findByReferenceId(salesOrder.getId()).isPresent()) {
            return;
        }

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(nextEntryNumber())
                .transactionDate(LocalDateTime.now())
                .referenceId(salesOrder.getId())
                .description("Sales Order " + salesOrder.getOrderNumber())
                .status(JournalEntryStatus.POSTED)
                .build();
        journalEntryRepository.save(entry);

        Account cashAccount    = requireAccount("CASH");
        Account revenueAccount = requireAccount("REVENUE");

        for (SaleItem item : salesOrder.getItems()) {
            // Use lineTotal (already computed) — fallback to unitPrice × qty
            BigDecimal lineTotal = item.getLineTotal() != null && item.getLineTotal().compareTo(BigDecimal.ZERO) > 0
                    ? item.getLineTotal()
                    : item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

            String productName = item.getProduct() != null ? item.getProduct().getName() : "Unknown";

            // Debit: Cash / Accounts Receivable
            journalItemRepository.save(JournalItem.builder()
                    .journalEntry(entry)
                    .account(cashAccount)
                    .debit(lineTotal)
                    .credit(BigDecimal.ZERO)
                    .description(productName)
                    .build());

            // Credit: Revenue
            journalItemRepository.save(JournalItem.builder()
                    .journalEntry(entry)
                    .account(revenueAccount)
                    .debit(BigDecimal.ZERO)
                    .credit(lineTotal)
                    .description(productName)
                    .build());
        }
    }

    // -------------------------------------------------------------------------
    // getChartOfAccounts
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<AccountDTO> getChartOfAccounts() {
        return accountRepository.findAll().stream()
                .map(account -> AccountDTO.builder()
                        .id(account.getId())
                        .code(account.getCode())
                        .name(account.getName())
                        .type(account.getType().name())
                        .balance(account.getBalance())
                        .description(account.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // getJournalEntries
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<JournalEntryDTO> getJournalEntries() {
        return journalEntryRepository.findAll().stream()
                .map(entry -> {
                    List<JournalItemDTO> items = entry.getItems().stream()
                            .map(item -> JournalItemDTO.builder()
                                    .id(item.getId())
                                    .accountId(item.getAccount().getId())
                                    .accountCode(item.getAccount().getCode())
                                    .accountName(item.getAccount().getName())
                                    .debit(item.getDebit())
                                    .credit(item.getCredit())
                                    .description(item.getDescription())
                                    .build())
                            .collect(Collectors.toList());

                    return JournalEntryDTO.builder()
                            .id(entry.getId())
                            .entryNumber(entry.getEntryNumber())
                            .transactionDate(entry.getTransactionDate())
                            .referenceId(entry.getReferenceId())
                            .description(entry.getDescription())
                            .status(entry.getStatus().name())
                            .items(items)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // getIncomeStatement
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public IncomeStatementDTO getIncomeStatement() {
        List<JournalEntry> postedEntries = journalEntryRepository.findAll().stream()
                .filter(e -> e.getStatus() == JournalEntryStatus.POSTED)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = postedEntries.stream()
                .flatMap(e -> e.getItems().stream())
                .filter(item -> item.getAccount().getType() == AccountType.REVENUE)
                .map(JournalItem::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cogs = postedEntries.stream()
                .flatMap(e -> e.getItems().stream())
                .filter(item -> item.getAccount().getType() == AccountType.EXPENSE
                        && item.getAccount().getCode().startsWith("COGS"))
                .map(JournalItem::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal operatingExpenses = postedEntries.stream()
                .flatMap(e -> e.getItems().stream())
                .filter(item -> item.getAccount().getType() == AccountType.EXPENSE
                        && !item.getAccount().getCode().startsWith("COGS"))
                .map(JournalItem::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossProfit = totalRevenue.subtract(cogs);
        BigDecimal netProfit   = grossProfit.subtract(operatingExpenses);

        return IncomeStatementDTO.builder()
                .revenue(totalRevenue)
                .costOfGoodsSold(cogs)
                .grossProfit(grossProfit)
                .operatingExpenses(operatingExpenses)
                .netProfit(netProfit)
                .build();
    }
}
