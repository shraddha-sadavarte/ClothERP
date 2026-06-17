package com.clotherp.backend.security;

import java.time.Duration;

public interface RefreshTokenStore {
    void store(String token, String username, Duration ttl);
    boolean isValid(String token);
    void revoke(String token);
}