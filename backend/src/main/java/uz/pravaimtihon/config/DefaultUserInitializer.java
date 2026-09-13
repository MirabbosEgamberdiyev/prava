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
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.init.default-users.enabled:true}")
    private boolean defaultUsersEnabled;

    @Value("${app.init.super-admin-password:SuperAdmin2026!}")
    private String superAdminPassword;

    @Value("${app.init.admin-password:Admin2026!}")
    private String adminPassword;

    @Value("${app.init.content-manager-password:Content2026!}")
    private String contentManagerPassword;

    @Value("${app.init.support-password:Support2026!}")
    private String supportPassword;

    @Value("${app.init.analyst-password:Analyst2026!}")
    private String analystPassword;

    @Value("${app.init.user-password:User2026!}")
    private String userPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!defaultUsersEnabled) {
            log.info("⏭️  DEFAULT USERS INITIALIZATION SKIPPED (disabled in config)");
            return;
        }
        log.info("=".repeat(80));
        log.info("🚀 DEFAULT USERS INITIALIZATION STARTED (ALL ROLES)");
        log.info("=".repeat(80));

        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT', 'ANALYST', 'USER'))");
            log.info("✅ Database constraint 'users_role_check' synchronized with all 6 roles.");
        } catch (Exception e) {
            log.warn("⚠️ Could not update users_role_check constraint: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'NEW'");
            jdbcTemplate.execute("ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS inquiry_type VARCHAR(30) DEFAULT 'CONTACT'");
            jdbcTemplate.execute("ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS admin_note TEXT");
            log.info("✅ Database columns for 'contact_inquiries' verified.");
        } catch (Exception e) {
            log.warn("⚠️ Could not ensure contact_inquiries columns: {}", e.getMessage());
        }

        initUser("superadmin@pravaonline.uz", "998901234567", "Super", "Admin", superAdminPassword, Role.SUPER_ADMIN);
        initUser("admin@pravaonline.uz", "998901234568", "System", "Admin", adminPassword, Role.ADMIN);
        initUser("content@pravaonline.uz", "998901234569", "Content", "Manager", contentManagerPassword, Role.CONTENT_MANAGER);
        initUser("support@pravaonline.uz", "998901234570", "Support", "Specialist", supportPassword, Role.SUPPORT);
        initUser("analyst@pravaonline.uz", "998901234571", "System", "Analyst", analystPassword, Role.ANALYST);
        initUser("user@pravaonline.uz", "998901234572", "Standard", "Student", userPassword, Role.USER);

        log.info("=".repeat(80));
        log.info("✅ DEFAULT USERS INITIALIZATION COMPLETED (ALL ROLES READY)");
        log.info("=".repeat(80));
    }

    private void initUser(String email, String phone, String firstName, String lastName, String rawPassword, Role role) {
        Optional<User> existingUser = userRepository.findByIdentifier(email);
        if (existingUser.isEmpty()) {
            existingUser = userRepository.findByIdentifier(phone);
        }

        if (existingUser.isEmpty()) {
            User user = User.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .phoneNumber(phone)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .preferredLanguage(AcceptLanguage.UZL)
                    .isActive(true)
                    .isEmailVerified(true)
                    .isPhoneVerified(true)
                    .build();

            userRepository.save(user);
            log.info("✅ DEFAULT USER CREATED: {} [{}] with password [{}]", email, role, rawPassword);
        } else {
            User user = existingUser.get();
            user.setRole(role);
            user.setIsActive(true);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            log.info("ℹ️  DEFAULT USER UPDATED: {} [{}] with password [{}]", email, role, rawPassword);
        }
    }
}