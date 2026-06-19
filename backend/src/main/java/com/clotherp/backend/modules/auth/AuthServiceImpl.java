package com.clotherp.backend.modules.auth;

import com.clotherp.backend.common.BusinessException;
import com.clotherp.backend.common.Role;
import com.clotherp.backend.modules.user.User;
import com.clotherp.backend.modules.user.UserDTO;
import com.clotherp.backend.modules.user.UserRepository;
import com.clotherp.backend.security.JwtTokenProvider;
import com.clotherp.backend.security.RefreshTokenStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpirationMillis;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider      jwtTokenProvider;
    private final UserDetailsService    userDetailsService;
    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final RefreshTokenStore     refreshTokenStore;

    // ── Login ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() ->
                new BadCredentialsException("Invalid credentials"));

        // Account lockout check
        if (user.getLockedUntil() != null
                && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                HttpStatus.LOCKED, "Account is temporarily locked. Try again later.");
        }

        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getUsername(), request.getPassword()));

            // Reset failed attempts on success
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);

            UserDetails userDetails = (UserDetails) auth.getPrincipal();
            return issueTokens(userDetails, user);

        } catch (BadCredentialsException ex) {
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);

            if (attempts >= 5) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
                log.warn("User '{}' locked for 30 min after {} failed attempts",
                    request.getUsername(), attempts);
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    // ── Register (used by Super Admin to create other users) ─────────────────

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Email already registered");
        }

        // Default to SALES_EXECUTIVE if role not provided
        Role role = request.getRole() != null
            ? request.getRole()
            : Role.SALES_EXECUTIVE;

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .role(role)
            .branchId(request.getBranchId())
            .active(true)
            .build();

        userRepository.save(user);

        UserDetails userDetails =
            userDetailsService.loadUserByUsername(user.getUsername());
        return issueTokens(userDetails, user);
    }

    // ── First-time admin setup (public endpoint, self-disabling) ─────────────

    @Override
    @Transactional
    public void registerFirstAdmin(RegisterRequest request) {

        if (userRepository.count() > 0) {
            throw new BusinessException("Setup already completed.");
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .role(Role.SUPER_ADMIN)
            .active(true)
            .build();

        userRepository.save(user);
        log.info("First Super Admin created: {}", request.getUsername());
    }

    // ── Refresh token ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Refresh token is required");
        }
        if (!refreshTokenStore.isValid(refreshToken)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Refresh token is invalid or revoked");
        }

        String username = jwtTokenProvider.extractUsername(refreshToken);
        UserDetails userDetails =
            userDetailsService.loadUserByUsername(username);

        if (!jwtTokenProvider.validateToken(refreshToken, userDetails)) {
            refreshTokenStore.revoke(refreshToken);
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        // Rotate refresh token
        refreshTokenStore.revoke(refreshToken);

        User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                new UsernameNotFoundException("User not found: " + username));

        return issueTokens(userDetails, user);
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Override
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenStore.revoke(refreshToken);
        }
    }

    // ── Change password ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {

        User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                new UsernameNotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "New password must differ from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ── Get current user ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                new UsernameNotFoundException("User not found: " + username));
        return UserDTO.fromEntity(user);
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private AuthResponse issueTokens(UserDetails userDetails, User user) {

        String accessToken  = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        Duration ttl = Duration.ofMillis(refreshExpirationMillis);
        refreshTokenStore.store(refreshToken, userDetails.getUsername(), ttl);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .user(UserDTO.fromEntity(user))
            .build();
    }
}