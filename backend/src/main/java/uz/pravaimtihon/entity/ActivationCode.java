package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Represents a single Ed25519-signed desktop activation code.
 *
 * <p>Tokens are tied to a specific machine ID and a validity window.
 * Each record captures the client metadata at generation time so that
 * the admin can trace who received which license key.</p>
 *
 * <p>The {@code licenseKey} column stores the formatted token exactly
 * as produced by {@code Ed25519LicenseService} (base64url, dots every 8 chars,
 * 68 bytes = 2+2 day offsets + 64-byte signature).</p>
 */
@Entity
@Table(
        name = "activation_codes",
        indexes = {
                @Index(name = "idx_ac_machine_id",   columnList = "machine_id"),
                @Index(name = "idx_ac_status",        columnList = "status"),
                @Index(name = "idx_ac_end_date",      columnList = "end_date"),
                @Index(name = "idx_ac_client_phone",  columnList = "client_phone"),
                @Index(name = "idx_ac_generated_by",  columnList = "created_by")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivationCode extends BaseEntity {

    // ── Client metadata (all optional) ────────────────────────────────────
    @Column(name = "client_first_name", nullable = true, length = 100)
    private String clientFirstName;

    @Column(name = "client_last_name", nullable = true, length = 100)
    private String clientLastName;

    @Column(name = "client_phone", nullable = true, length = 20)
    private String clientPhone;

    /** Optional: name of the driving school / learning centre. */
    @Column(name = "learning_center", length = 200)
    private String learningCenter;

    // ── License parameters ─────────────────────────────────────────────────
    /**
     * Target machine identifier (as entered by the admin or copied from the
     * desktop app).  Stored in upper-case; signing also upper-cases it.
     */
    @Column(name = "machine_id", nullable = false, length = 255)
    private String machineId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * The final formatted token (base64url with dots).
     * Unique per row — two identical machine+date combinations can still
     * exist if a key is regenerated after deactivation, but the token
     * byte-content will be identical (deterministic Ed25519).
     */
    // AES-256-GCM token: base64url(nonce[12] + ciphertext) ≈ 228 chars — use 300 for safety
    @Column(name = "license_key", nullable = false, length = 300, unique = true)
    private String licenseKey;

    // ── Status ─────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ActivationCodeStatus status = ActivationCodeStatus.ACTIVE;

    // ── Audit extras ───────────────────────────────────────────────────────
    /** Free-text field for admin notes (reason for deactivation, etc.). */
    @Column(name = "notes", length = 500)
    private String notes;
}
