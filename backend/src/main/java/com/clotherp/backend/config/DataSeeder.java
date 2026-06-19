package com.clotherp.backend.config;

import com.clotherp.backend.common.Role;
import com.clotherp.backend.modules.user.User;
import com.clotherp.backend.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        if (userRepository.count() > 0) {
            log.info("DataSeeder: skipping — users already exist.");
            return;
        }

        User superAdmin = User.builder()
            .username("superadmin")
            .email("superadmin@clotherp.com")
            .password(passwordEncoder.encode("Admin@1234"))
            .fullName("Super Administrator")
            .role(Role.SUPER_ADMIN)          // ← Role enum, not String
            .active(true)                    // ← active not isActive
            .build();

        userRepository.save(superAdmin);

        log.info("");
        log.info("╔══════════════════════════════════════════════╗");
        log.info("║       DEFAULT SUPER ADMIN CREATED            ║");
        log.info("║  Username : superadmin                       ║");
        log.info("║  Password : Admin@1234                       ║");
        log.info("║  CHANGE PASSWORD AFTER FIRST LOGIN           ║");
        log.info("╚══════════════════════════════════════════════╝");
        log.info("");
    }
}