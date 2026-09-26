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

/**
 * Boshlang'ich xodim akkauntlarini yaratadi.
 *
 * <p>SECURITY qoidalari:
 * <ul>
 *   <li>Default holatda O'CHIQ ({@code app.init.default-users.enabled=false}).</li>
 *   <li>Kodda hech qanday parol yo'q — akkaunt faqat tegishli env o'zgaruvchisi
 *       (masalan {@code APP_INIT_SUPER_ADMIN_PASSWORD}) bo'sh bo'lmaganda yaratiladi.</li>
 *   <li>Mavjud akkauntlarga HECH QACHON tegilmaydi (parol, rol, faollik o'zgarmaydi).</li>
 *   <li>Qidiruv faqat email bo'yicha — telefon raqami bo'yicha fallback yo'q.</li>
 *   <li>Parollar log'ga yozilmaydi.</li>
 * </ul>
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DefaultUserInitializer implements CommandLineRunner {

    private static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.init.default-users.enabled:false}")
    private boolean defaultUsersEnabled;

    @Value("${app.init.super-admin-password:}")
    private String superAdminPassword;

    @Value("${app.init.admin-password:}")
    private String adminPassword;

    @Value("${app.init.content-manager-password:}")
    private String contentManagerPassword;

    @Value("${app.init.support-password:}")
    private String supportPassword;

    @Value("${app.init.analyst-password:}")
    private String analystPassword;

    @Value("${app.init.user-password:}")
    private String userPassword;

    @Override
    @Transactional
    public void run(String... args) {
        // Schema sinxronlash seed'dan mustaqil bajariladi (keyinchalik Flyway'ga ko'chiriladi).
        syncSchema();

        if (!defaultUsersEnabled) {
            log.info("Default users initialization skipped (app.init.default-users.enabled=false)");
            return;
        }

        initUser("superadmin@pravaonline.uz", "Super", "Admin", superAdminPassword, Role.SUPER_ADMIN);
        initUser("admin@pravaonline.uz", "System", "Admin", adminPassword, Role.ADMIN);
        initUser("content@pravaonline.uz", "Content", "Manager", contentManagerPassword, Role.CONTENT_MANAGER);
        initUser("support@pravaonline.uz", "Support", "Specialist", supportPassword, Role.SUPPORT);
        initUser("analyst@pravaonline.uz", "System", "Analyst", analystPassword, Role.ANALYST);
        initUser("user@pravaonline.uz", "Standard", "Student", userPassword, Role.USER);
    }

    private void syncSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT', 'ANALYST', 'USER'))");
        } catch (Exception e) {
            log.warn("Could not update users_role_check constraint: {}", e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'NEW'");
            jdbcTemplate.execute("ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS inquiry_type VARCHAR(30) DEFAULT 'CONTACT'");
            jdbcTemplate.execute("ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS admin_note TEXT");
        } catch (Exception e) {
            log.warn("Could not ensure contact_inquiries columns: {}", e.getMessage());
        }
    }

    private void initUser(String email, String firstName, String lastName, String rawPassword, Role role) {
        if (rawPassword == null || rawPassword.isBlank()) {
            log.info("Seed {} skipped: password env is not set", role);
            return;
        }
        if (rawPassword.trim().length() < MIN_PASSWORD_LENGTH) {
            log.error("Seed {} skipped: password must be at least {} characters", role, MIN_PASSWORD_LENGTH);
            return;
        }
        if (userRepository.findByIdentifier(email).isPresent()) {
            log.debug("Seed {} skipped: {} already exists (not modified)", role, email);
            return;
        }

        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword.trim()))
                .role(role)
                .preferredLanguage(AcceptLanguage.UZL)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        userRepository.save(user);
        log.info("Seeded {} account {}", role, email);
    }
}
