package com.clotherp.backend.config;

import com.clotherp.backend.common.Role;
import com.clotherp.backend.modules.user.User;
import com.clotherp.backend.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            System.out.println("No users found in database. Initializing default admin user...");
                User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin"))
                    .email("admin@clotherp.com")
                    .role(Role.SUPER_ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user created with username 'admin' and password 'admin'.");
        }
    }
}
