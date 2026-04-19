package uz.pravaimtihon.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;

import java.time.LocalDateTime;

/**
 * Grants one user access to one package.
 * Unique (user_id, package_id) — double-grant impossible even on webhook retry.
 */
@Entity
@Table(name = "user_package_access",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_upa_user_package",
                columnNames = {"user_id", "package_id"}),
        indexes = {
                @Index(name = "idx_upa_user", columnList = "user_id"),
                @Index(name = "idx_upa_package", columnList = "package_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPackageAccess extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private ExamPackage examPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    /**
     * null = lifetime access. Not-null = expiring access.
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoke_reason", length = 255)
    private String revokeReason;

    public boolean isValidNow() {
        if (Boolean.TRUE.equals(revoked)) return false;
        if (expiresAt == null) return true;
        return LocalDateTime.now().isBefore(expiresAt);
    }
}
