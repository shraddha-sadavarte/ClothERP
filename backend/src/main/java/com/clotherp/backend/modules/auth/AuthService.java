package com.clotherp.backend.modules.auth;

import com.clotherp.backend.modules.user.UserDTO;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
    void changePassword(String username, ChangePasswordRequest request);
    UserDTO getCurrentUser(String username);
}