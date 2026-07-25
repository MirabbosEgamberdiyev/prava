package uz.pravaimtihon.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.repository.UserRepository;

import java.util.Optional;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DefaultUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.init.default-users.enabled:true}")
    private boolean defaultUsersEnabled;

    @Value("${app.init.super-admin-password:$2026Super$Admin2026$}")
    private String superAdminPassword;

    @Value("${app.init.admin-password:$2026Admin$Admin2026$}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!defaultUsersEnabled) {
            log.info("⏭️  DEFAULT USERS INITIALIZATION SKIPPED (disabled in config)");
            return;
        }
        log.info("=".repeat(80));
        log.info("🚀 DEFAULT USERS INITIALIZATION STARTED");
        log.info("=".repeat(80));

        createDefaultSuperAdmin();
        createDefaultAdmin();

        log.info("=".repeat(80));
        log.info("✅ DEFAULT USERS INITIALIZATION COMPLETED");
        log.info("=".repeat(80));
    }

    private void createDefaultSuperAdmin() {
        String superAdminEmail = "superadmin@pravaonline.uz";
        String superAdminPhone = "998901234567";

        Optional<User> existingUser = userRepository.findByIdentifier(superAdminEmail);
        if (existingUser.isEmpty()) {
            existingUser = userRepository.findByIdentifier(superAdminPhone);
        }

        if (existingUser.isEmpty()) {
            // YANGI YARATISH (Sizning eski kodingiz)
            User superAdmin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email(superAdminEmail)
                    .phoneNumber(superAdminPhone)
                    .passwordHash(passwordEncoder.encode(superAdminPassword))
                    .role(Role.SUPER_ADMIN)
                    .preferredLanguage(AcceptLanguage.UZL)
                    .isActive(true)
                    .isEmailVerified(true)
                    .isPhoneVerified(true)
                    .build();

            userRepository.save(superAdmin);
            log.info("✅ DEFAULT SUPER ADMIN CREATED");

        } else {
            // MAVJUD BO'LSA — parolga TEGILMAYDI (admin uni keyinroq o'zgartirgan
            // bo'lishi mumkin; har restartda reset qilish xavfsizlik teshigi edi).
            log.info("ℹ️  SuperAdmin allaqachon mavjud - o'tkazib yuborildi (parol o'zgartirilmadi)");
        }
    }

    private void createDefaultAdmin() {
        String adminEmail = "admin@pravaonline.uz";
        String adminPhone = "998901234568";

        Optional<User> existingUser = userRepository.findByIdentifier(adminEmail);
        if (existingUser.isEmpty()) {
            existingUser = userRepository.findByIdentifier(adminPhone);
        }

        if (existingUser.isEmpty()) {
            // YANGI YARATISH (Sizning eski kodingiz)
            User admin = User.builder()
                    .firstName("Default")
                    .lastName("Admin")
                    .email(adminEmail)
                    .phoneNumber(adminPhone)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .preferredLanguage(AcceptLanguage.UZL)
                    .isActive(true)
                    .isEmailVerified(true)
                    .isPhoneVerified(true)
                    .build();

            userRepository.save(admin);
            log.info("✅ DEFAULT ADMIN CREATED");

        } else {
            // MAVJUD BO'LSA — parolga TEGILMAYDI (izoh yuqorida, super-admin bilan bir xil sabab).
            log.info("ℹ️  Admin allaqachon mavjud - o'tkazib yuborildi (parol o'zgartirilmadi)");
        }
    }
}