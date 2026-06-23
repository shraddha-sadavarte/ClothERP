package com.clotherp.backend.modules.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserService {
    Page<UserDTO> getAllUsers(Pageable pageable);   
    UserDTO getUserById(UUID id);
    UserDTO getUserByUsername(String username);
    UserDTO updateUser(UUID id, UpdateUserRequest request);
}