package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * O'quv markaziga biriktirilgan kompyuter (ish o'rni).
 *
 * <p>Har bir kompyuter uchun aktivatsiya kodi generatsiya qilinadi.
 * {@code machineId} — desktop ilovasi ko'rsatadigan apparat identifikatori;
 * aynan shu maydon asosida Ed25519 token imzolanadi.</p>
 */
@Entity
@Table(
    name = "computers",
    indexes = {
        @Index(name = "idx_comp_lc",         columnList = "learning_center_id"),
        @Index(name = "idx_comp_machine_id",  columnList = "machine_id"),
        @Index(name = "idx_comp_status",      columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Computer extends BaseEntity {

    /** Kompyuterning inson o'qiy oladigan nomi (masalan, "Kompyuter 3"). */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /**
     * Desktop ilova tomonidan ko'rsatiladigan apparat identifikatori.
     * Ed25519 token imzolashda aynan shu qiymat ishlatiladi.
     */
    @Column(name = "machine_id", nullable = false, length = 255)
    private String machineId;

    /** Tarmoq kartasining MAC manzili (ixtiyoriy). */
    @Column(name = "mac_address", length = 50)
    private String macAddress;

    /** Qo'shimcha qurilma identifikatori (ixtiyoriy). */
    @Column(name = "device_id", length = 255)
    private String deviceId;

    /** Bu kompyuter qaysi o'quv markaziga tegishli. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_center_id", nullable = false)
    private LearningCenter learningCenter;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ComputerStatus status = ComputerStatus.ACTIVE;

    /** Qo'shimcha izoh. */
    @Column(name = "notes", length = 500)
    private String notes;
}
