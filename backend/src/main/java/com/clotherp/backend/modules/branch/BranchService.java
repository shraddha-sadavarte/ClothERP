package com.clotherp.backend.modules.branch;

import java.util.List;
import java.util.UUID;

public interface BranchService {
    List<BranchDTO> getAllActiveBranches();
    BranchDTO createBranch(BranchDTO dto);
    BranchDTO getBranchById(UUID id);
    BranchDTO updateBranch(UUID id, BranchDTO dto);
    void deactivateBranch(UUID id);
}
