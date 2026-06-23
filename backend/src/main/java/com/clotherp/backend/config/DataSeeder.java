package com.clotherp.backend.config;

import com.clotherp.backend.common.Role;
import com.clotherp.backend.modules.branch.Branch;
import com.clotherp.backend.modules.branch.BranchRepository;
import com.clotherp.backend.modules.user.User;
import com.clotherp.backend.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BranchRepository branchRepository;

    @Override
    public void run(String... args) {

        // ── 1. Seed branches ────────────────────────────────────────────────
        if (branchRepository.count() == 0) {
            Branch headOffice = Branch.builder()
                    .name("Head Office")
                    .code("HO")
                    .address("123 Main Street")
                    .city("Mumbai")
                    .state("Maharashtra")
                    .pinCode("400001")
                    .phone("022-12345678")
                    .active(true)
                    .build();

            Branch delhiStore = Branch.builder()
                    .name("Delhi Store")
                    .code("DEL")
                    .address("456 Connaught Place")
                    .city("Delhi")
                    .state("Delhi")
                    .pinCode("110001")
                    .phone("011-87654321")
                    .active(true)
                    .build();

            branchRepository.saveAll(List.of(headOffice, delhiStore));
            log.info("DataSeeder: seeded 2 default branches (HO, DEL).");
        } else {
            log.info("DataSeeder: branches already exist — skipping branch seed.");
        }

        // ── 2. Seed super-admin user ─────────────────────────────────────────
        if (userRepository.count() > 0) {
            log.info("DataSeeder: skipping — users already exist.");
            return;
        }

        User superAdmin = User.builder()
            .username("superadmin")
            .email("superadmin@clotherp.com")
            .password(passwordEncoder.encode("Admin@1234"))
            .fullName("Super Administrator")
            .role(Role.SUPER_ADMIN)
            .active(true)
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