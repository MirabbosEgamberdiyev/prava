package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * O'quv markazi (haydovchilik maktabi).
 * Har bir o'quv markaziga bir nechta kompyuter va aktivatsiya kodlari biriktiriladi.
 */
@Entity
@Table(
    name = "learning_centers",
    indexes = {
        @Index(name = "idx_lc_status", columnList = "status"),
        @Index(name = "idx_lc_name",   columnList = "name")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningCenter extends BaseEntity {

    /** O'quv markazi nomi (majburiy). */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /** Manzil. */
    @Column(name = "address", length = 300)
    private String address;

    /** Aloqa telefoni. */
    @Column(name = "phone", length = 20)
    private String phone;

    /** Mas'ul shaxs ismi. */
    @Column(name = "contact_person", length = 200)
    private String contactPerson;

    /** Email manzili. */
    @Column(name = "email", length = 100)
    private String email;

    /** Qo'shimcha izoh. */
    @Column(name = "notes", length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private LearningCenterStatus status = LearningCenterStatus.ACTIVE;
}
