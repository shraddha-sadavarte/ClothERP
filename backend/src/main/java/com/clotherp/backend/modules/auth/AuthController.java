package com.clotherp.backend.modules.auth;

import com.clotherp.backend.common.ApiResponse;
import com.clotherp.backend.modules.user.UserDTO;
import com.clotherp.backend.modules.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService    authService;
    private final UserRepository userRepository;

    // ── Login — always public ────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(
            ApiResponse.ok(authService.login(request), "Login successful"));
    }

    // ── Register — Supports self-registration for non-privileged roles ────────
    // No token needed for SALES_EXECUTIVE and other non-privileged roles.
    // Privileged roles (OWNER, BRANCH_MANAGER, etc.) require an admin JWT.
    // First ever registration (no users in DB) always creates a SUPER_ADMIN.

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(
            @Valid @RequestBody RegisterRequest request) {

        // Bootstrap: first ever user becomes SUPER_ADMIN
        if (userRepository.count() == 0) {
            authService.registerFirstAdmin(request);
            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                    "Super Admin created successfully. Please login.",
                    "Setup complete"));
        }

        // Ongoing: delegate to service — it enforces role-based access internally
        authService.register(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.ok(
                "Registration successful. Please login.",
                "Registration complete"));
    }

    // ── Refresh token ────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshRequest request) {

        return ResponseEntity.ok(
            ApiResponse.ok(authService.refreshToken(request.getRefreshToken())));
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshRequest request) {

        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    // ── Change password — requires valid JWT ─────────────────────────────────

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {

        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password changed successfully"));
    }

    // ── Get current user profile — requires valid JWT ─────────────────────────

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(
            Authentication authentication) {

        return ResponseEntity.ok(
            ApiResponse.ok(authService.getCurrentUser(authentication.getName())));
    }
}