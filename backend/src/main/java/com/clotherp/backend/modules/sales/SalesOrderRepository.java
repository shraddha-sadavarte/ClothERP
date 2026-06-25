package com.clotherp.backend.modules.sales;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {
    List<SalesOrder> findByBranchId(UUID branchId);

    @Query("SELECT o FROM SalesOrder o JOIN FETCH o.items i JOIN FETCH i.product")
    Page<SalesOrder> findAllWithItemsAndProducts(Pageable pageable);

    @Query("SELECT o FROM SalesOrder o JOIN FETCH o.items i JOIN FETCH i.product WHERE o.id = :id")
    Optional<SalesOrder> findByIdWithItemsAndProducts(@Param("id") UUID id);

    Page<SalesOrder> findByBranchId(UUID branchId, Pageable pageable);
}