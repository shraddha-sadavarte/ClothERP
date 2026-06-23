package com.clotherp.backend.modules.branch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {
    List<Branch> findByActiveTrue();
    boolean existsByCode(String code);
    Optional<Branch> findByCode(String code);
}
