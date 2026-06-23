package com.clotherp.backend.modules.accounting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JournalItemRepository extends JpaRepository<JournalItem, UUID> {
    // Additional query methods can be added here if needed
}
