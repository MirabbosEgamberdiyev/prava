package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * O'quv markazi kompyuteri uchun Ed25519-imzolangan aktivatsiya kodi.
 *
 * <p>Token {@code Computer.machineId} asosida imzolanadi.
 * {@code machineId} maydoni generatsiya paytidagi snapshot — kompyuter
 * o'zgarsa ham tarixiy yozuv saqlanib qoladi.</p>
 */
@Entity
@Table(
    name = "activation_codes",
    indexes = {
        @Index(name = "idx_ac_machine_id",  columnList = "machine_id"),
        @Index(name = "idx_ac_status",      columnList = "status"),
        @Index(name = "idx_ac_end_date",    columnList = "end_date"),
        @Index(name = "idx_ac_created_by",  columnList = "created_by"),
        @Index(name = "idx_ac_computer",    columnList = "computer_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivationCode extends BaseEntity {

    // ── Kompyuter bog'lanishi ──────────────────────────────────────────────

    /**
     * Bu aktivatsiya kodi qaysi kompyuter uchun yaratilgan.
     * nullable=true — eski ma'lumotlar buzilmasligi uchun.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "computer_id")
    private Computer computer;

    // ── Token parametrlari ────────────────────────────────────────────────

    /**
     * Generatsiya paytida olingan machineId snapshot.
     * Ed25519 imzolashda ishlatiladi; kompyuter o'chirilsa ham qoladi.
     */
    @Column(name = "machine_id", nullable = false, length = 255)
    private String machineId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Tayyor formatdagi token (base64url, har 8 belgida nuqta).
     * Ed25519: 68 bayt (4 + 64) → ~102 belgi.
     */
    @Column(name = "license_key", nullable = false, length = 1000, unique = true)
    private String licenseKey;

    // ── Status ─────────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ActivationCodeStatus status = ActivationCodeStatus.ACTIVE;

    // ── Qo'shimcha ─────────────────────────────────────────────────────────

    /** Admin izohi (deaktivatsiya sababi va h.k.). */
    @Column(name = "notes", length = 500)
    private String notes;
}
