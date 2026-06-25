package com.clotherp.backend.modules.branch;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BranchDTO> getAllActiveBranches() {
        return branchRepository.findByActiveTrue()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public BranchDTO createBranch(BranchDTO dto) {
        if (branchRepository.existsByCode(dto.getCode())) {
            throw new BusinessException("Branch code already exists: " + dto.getCode());
        }
        Branch branch = toEntity(dto);
        return toDTO(branchRepository.save(branch));
    }

    @Override
    @Transactional(readOnly = true)
    public BranchDTO getBranchById(UUID id) {
        return branchRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id));
    }

    @Override
    public BranchDTO updateBranch(UUID id, BranchDTO dto) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id));
        branch.setName(dto.getName());
        branch.setCode(dto.getCode());
        branch.setAddress(dto.getAddress());
        branch.setCity(dto.getCity());
        branch.setState(dto.getState());
        branch.setPinCode(dto.getPinCode());
        branch.setPhone(dto.getPhone());
        branch.setActive(dto.isActive());
        return toDTO(branchRepository.save(branch));
    }

    @Override
    public void deactivateBranch(UUID id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", id));
        branch.setActive(false);
        branchRepository.save(branch);
    }

    // ---------- mappers ----------

    private BranchDTO toDTO(Branch b) {
        return BranchDTO.builder()
                .id(b.getId())
                .name(b.getName())
                .code(b.getCode())
                .address(b.getAddress())
                .city(b.getCity())
                .state(b.getState())
                .pinCode(b.getPinCode())
                .phone(b.getPhone())
                .active(b.isActive())
                .build();
    }

    private Branch toEntity(BranchDTO dto) {
        return Branch.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .pinCode(dto.getPinCode())
                .phone(dto.getPhone())
                .active(dto.isActive())
                .build();
    }
}