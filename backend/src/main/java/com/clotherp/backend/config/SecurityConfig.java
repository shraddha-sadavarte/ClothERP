package com.clotherp.backend.config;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.clotherp.backend.security.JwtAuthFilter;
import com.clotherp.backend.security.UserPrincipal;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public AuthenticationEntryPoint authEntryPoint() {
        return (request, response, authException) -> {
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write(
                "{\"success\":false,\"statusCode\":401,\"message\":\"Unauthorized\"}"
            );
        };
    }

    @Bean
    public AuditorAware<UUID> auditorAware() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null
                    && auth.isAuthenticated()
                    && auth.getPrincipal() instanceof UserPrincipal up) {
                return Optional.of(up.getId());
            }
            return Optional.empty();
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Auth endpoints — always public ───────────────────────────
                .requestMatchers(HttpMethod.POST,
                    "/api/v1/auth/login",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/logout"
                ).permitAll()

                // ── First-run setup — public ONLY when no users exist ────────
                // The controller itself blocks this once users exist
                .requestMatchers(HttpMethod.POST,
                    "/api/v1/auth/setup"
                ).permitAll()

                // ── Swagger (dev only) ───────────────────────────────────────
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // ── User management ──────────────────────────────────────────
               .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").permitAll()

                // ── Branch management ────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/branches/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "BRANCH_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/v1/branches/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER")
                .requestMatchers(HttpMethod.PUT, "/api/v1/branches/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/branches/**")
                    .hasRole("SUPER_ADMIN")

                // ── Products ─────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/products/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
                                "SALES_EXECUTIVE", "CASHIER", "PURCHASE_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/v1/products/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "PURCHASE_MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/v1/products/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "PURCHASE_MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER")

                // ── Sales ────────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/sales/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
                                "SALES_EXECUTIVE", "CASHIER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/v1/sales/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
                                "SALES_EXECUTIVE")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/sales/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
                                "SALES_EXECUTIVE", "CASHIER")

                // ── Inventory ────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/inventory/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
                                "WAREHOUSE_MANAGER", "PURCHASE_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/v1/inventory/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "WAREHOUSE_MANAGER",
                                "PURCHASE_MANAGER")

                // ── Purchase ─────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/v1/purchase/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "PURCHASE_MANAGER",
                                "BRANCH_MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/v1/purchase/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "PURCHASE_MANAGER")

                // ── Accounting ───────────────────────────────────────────────
                .requestMatchers("/api/v1/accounting/**")
                    .hasAnyRole("SUPER_ADMIN", "OWNER", "ACCOUNTANT")

                // ── Admin only ───────────────────────────────────────────────
                .requestMatchers("/api/v1/admin/**")
                    .hasRole("SUPER_ADMIN")

                // ── Everything else needs a valid JWT ────────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(e -> e.authenticationEntryPoint(authEntryPoint()));

        return http.build();
    }
}