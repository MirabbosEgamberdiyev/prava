package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * O'quv markaz bilan tuzilgan shartnoma haqida oddiy eslatma.
 * Bu yozuv hech qanday aktivatsiya kodi yoki license bilan bog'lanmagan —
 * faqat admin uchun "kim bilan, qachongacha, necha kompyuter, qancha pulga"
 * shartnoma qilinganini eslab qolish vositasi.
 */
@Entity
@Table(
    name = "learning_center_agreements",
    indexes = {
        @Index(name = "idx_lca_center",    columnList = "learning_center_id"),
        @Index(name = "idx_lca_status",    columnList = "status"),
        @Index(name = "idx_lca_end_date",  columnList = "end_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningCenterAgreement extends BaseEntity {

    /** O'quv markaz (majburiy). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_center_id", nullable = false)
    private LearningCenter learningCenter;

    /** Kompyuterlar soni. */
    @Column(name = "computer_count", nullable = false)
    private Integer computerCount;

    /** Shartnoma boshlanish sanasi. Bo'sh bo'lsa — yaratilgan sanaga teng. */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** Shartnoma tugash sanasi (majburiy). */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** Holat: REJADA / FAOL / TUGAGAN / BEKOR. */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AgreementStatus status = AgreementStatus.ACTIVE;

    /** Shartnoma summasi (so'm). null bo'lsa — yozilmagan. */
    @Column(name = "amount", precision = 19, scale = 2)
    private BigDecimal amount;

    /** Erkin matn izoh. */
    @Column(name = "note", length = 2000)
    private String note;

    public enum AgreementStatus {
        PLANNED,   // Rejada — hali boshlangan emas
        ACTIVE,    // Faol
        EXPIRED,   // Muddati tugagan
        CANCELLED  // Bekor qilingan
    }
}
