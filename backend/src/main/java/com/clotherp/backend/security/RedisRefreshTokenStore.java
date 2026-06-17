package com.clotherp.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

//@Component
@ConditionalOnProperty(name = "spring.redis.host")  // only if Redis is configured
@RequiredArgsConstructor
public class RedisRefreshTokenStore implements RefreshTokenStore {

    private static final String KEY_PREFIX = "refresh_token:";
    private final StringRedisTemplate redisTemplate;

    @Override
    public void store(String token, String username, Duration ttl) {
        redisTemplate.opsForValue().set(KEY_PREFIX + token, username, ttl);
    }

    @Override
    public boolean isValid(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + token));
    }

    @Override
    public void revoke(String token) {
        redisTemplate.delete(KEY_PREFIX + token);
    }
}