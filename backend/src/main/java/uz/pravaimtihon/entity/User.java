package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.OAuthProvider;
import uz.pravaimtihon.enums.Role;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User entity - Main user table
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_phone", columnList = "phone_number"),
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_deleted", columnList = "deleted"),
        @Index(name = "idx_user_active", columnList = "is_active"),
        @Index(name = "idx_user_google_id", columnList = "google_id"),
        @Index(name = "idx_user_telegram_id", columnList = "telegram_id"),
        @Index(name = "idx_user_oauth_provider", columnList = "oauth_provider")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @NotBlank
    @Size(min = 2, max = 50)
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Size(max = 50)
    @Column(name = "last_name", length = 50)
    private String lastName;

    @Pattern(regexp = "^998[0-9]{9}$")
    @Column(name = "phone_number", unique = true, length = 15)
    private String phoneNumber;

    @Email
    @Column(name = "email", unique = true, length = 100)
    private String email;

    @NotBlank
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_language", nullable = false, length = 10)
    @Builder.Default
    private AcceptLanguage preferredLanguage = AcceptLanguage.UZL;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "is_phone_verified", nullable = false)
    @Builder.Default
    private Boolean isPhoneVerified = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "telegram_id", unique = true)
    private String telegramId;

    @Column(name = "telegram_username", length = 100)
    private String telegramUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "oauth_provider", length = 20)
    @Builder.Default
    private OAuthProvider oauthProvider = OAuthProvider.LOCAL;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    /**
     * Maksimal qurilmalar soni (1-10).
     * Default: 4 ta qurilma.
     */
    @Column(name = "max_devices", columnDefinition = "INTEGER DEFAULT 4")
    @Builder.Default
    private Integer maxDevices = 4;

    /**
     * Hozirgi faol qurilmalar/sessiyalar soni.
     */
    @Column(name = "active_device_count", columnDefinition = "INTEGER DEFAULT 0")
    @Builder.Default
    private Integer activeDeviceCount = 0;

    /**
     * Device limit alohida o'rnatilganmi (userId orqali)?
     * Agar true bo'lsa, global o'zgarish ta'sir qilmaydi.
     */
    @Column(name = "device_limit_customized", columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Builder.Default
    private Boolean deviceLimitCustomized = false;

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefreshToken> refreshTokens;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamSession> examSessions;

    // Helper methods
    public String getFullName() {
        String first = firstName != null ? firstName : "";
        String last = lastName != null ? lastName : "";
        if (!last.isBlank()) {
            return (first + " " + last).trim();
        }
        return first;
    }

    public boolean isAccountLocked() {
        if (accountLockedUntil == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(accountLockedUntil);
    }

    public void incrementFailedLoginAttempts() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.accountLockedUntil = LocalDateTime.now().plusMinutes(30);
        }
    }

    public void resetFailedLoginAttempts() {
        this.failedLoginAttempts = 0;
        this.accountLockedUntil = null;
    }

    /**
     * Yangi qurilma qo'shish mumkinmi?
     */
    public boolean canAddNewDevice() {
        return activeDeviceCount < maxDevices;
    }

    /**
     * Qurilma sonini oshirish.
     */
    public void incrementActiveDevices() {
        this.activeDeviceCount++;
    }

    /**
     * Qurilma sonini kamaytirish.
     */
    public void decrementActiveDevices() {
        if (this.activeDeviceCount > 0) {
            this.activeDeviceCount--;
        }
    }

    /**
     * Qolgan qurilma slotlari.
     */
    public int getRemainingDeviceSlots() {
        return Math.max(0, maxDevices - activeDeviceCount);
    }

    @PrePersist
    @PreUpdate
    private void validateUser() {
        boolean hasPhone = phoneNumber != null && !phoneNumber.isBlank();
        boolean hasEmail = email != null && !email.isBlank();
        boolean hasTelegram = telegramId != null && !telegramId.isBlank();
        boolean hasGoogle = googleId != null && !googleId.isBlank();

        if (!hasPhone && !hasEmail && !hasTelegram && !hasGoogle) {
            throw new IllegalStateException("Phone number, email, Telegram ID, or Google ID must be provided");
        }
    }
}
