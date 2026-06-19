package com.clotherp.backend.modules.auth;

import com.clotherp.backend.common.ApiResponse;
import com.clotherp.backend.modules.user.User;
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

    // ── Register — SELF-DISABLING after first user exists ───────────────────
    // No token needed. Works only when database has zero users.
    // After first user is created, this returns 403 forever.

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(
            @Valid @RequestBody RegisterRequest request) {

        // Block if ANY user already exists
        if (userRepository.count() > 0) {
            return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403,
                    "Registration is disabled. " +
                    "Ask your Super Admin to create users from the Users module."));
        }

        // First ever user is always SUPER_ADMIN
        authService.registerFirstAdmin(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.ok(
                "Super Admin created successfully. Please login.",
                "Setup complete"));
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