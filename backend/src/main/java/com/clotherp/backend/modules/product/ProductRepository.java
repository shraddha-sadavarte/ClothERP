package com.clotherp.backend.modules.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);

    Page<Product> findByBranchId(UUID branchId, Pageable pageable);
    List<Product> findByBranchId(UUID branchId);

    // ✅ Case‑insensitive search for POS (returns List)
    @Query("SELECT p FROM Product p WHERE p.branchId = :branchId AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findByBranchIdAndSearchIgnoreCase(@Param("branchId") UUID branchId, @Param("search") String search);

    // ✅ Case‑insensitive search for paginated product list
    @Query("SELECT p FROM Product p WHERE p.branchId = :branchId AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchByBranchAndKeyword(@Param("branchId") UUID branchId, @Param("search") String search, Pageable pageable);
}