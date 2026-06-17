package com.clotherp.backend.modules.auth;

import com.clotherp.backend.modules.user.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    // Added so the frontend doesn't need a second round-trip to /auth/me
    // just to know who logged in and what they're allowed to do.
    private UserDTO user;
}