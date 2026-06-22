package com.clotherp.backend.modules.sales;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {
    List<SalesOrder> findByBranchId(UUID branchId);
}
