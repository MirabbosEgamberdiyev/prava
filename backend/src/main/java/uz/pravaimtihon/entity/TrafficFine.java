package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * B-08: yo'l harakati qoidabuzarligi uchun ma'muriy jarima (MJtK moddasi).
 *
 * <p>Summalar so'mda SAQLANMAYDI — faqat BHM (bazaviy hisoblash miqdori) koeffitsientlari.
 * Summa = koeffitsient × joriy BHM ({@link BhmRate}); BHM o'zgarsa jarimalarni qayta yozish shart emas.
 * Jadval V13 migratsiyasida yaratiladi.
 */
@Entity
@Table(name = "traffic_fines", indexes = {
        @Index(name = "idx_traffic_fines_active_sort", columnList = "active, sort_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrafficFine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "article_code", nullable = false, length = 50)
    private String articleCode;

    @Column(name = "title_uzl", nullable = false, columnDefinition = "TEXT")
    private String titleUzl;

    @Column(name = "title_uzc", columnDefinition = "TEXT")
    private String titleUzc;

    @Column(name = "title_ru", columnDefinition = "TEXT")
    private String titleRu;

    /** Minimal jarima — BHM koeffitsienti (masalan 0.5, 1, 5). */
    @Column(name = "bhm_min", nullable = false, precision = 10, scale = 2)
    private BigDecimal bhmMin;

    /** Maksimal jarima — BHM koeffitsienti (oraliq bo'lmasa null). */
    @Column(name = "bhm_max", precision = 10, scale = 2)
    private BigDecimal bhmMax;

    /** Qo'shimcha jazo (haydovchilik huquqidan mahrum qilish, ma'muriy qamoq, ...). */
    @Column(name = "extra_sanction_uzl", columnDefinition = "TEXT")
    private String extraSanctionUzl;

    @Column(name = "extra_sanction_uzc", columnDefinition = "TEXT")
    private String extraSanctionUzc;

    @Column(name = "extra_sanction_ru", columnDefinition = "TEXT")
    private String extraSanctionRu;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
