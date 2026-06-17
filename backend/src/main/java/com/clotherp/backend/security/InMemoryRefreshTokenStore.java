package com.clotherp.backend.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component   // <-- unconditional, no condition
public class InMemoryRefreshTokenStore implements RefreshTokenStore {

    private final Map<String, String> store = new ConcurrentHashMap<>();

    @Override
    public void store(String token, String username, Duration ttl) {
        store.put(token, username);
    }

    @Override
    public boolean isValid(String token) {
        return store.containsKey(token);
    }

    @Override
    public void revoke(String token) {
        store.remove(token);
    }
}