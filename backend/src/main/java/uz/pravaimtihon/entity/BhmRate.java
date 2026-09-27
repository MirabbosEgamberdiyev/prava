package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * B-08: bazaviy hisoblash miqdori (BHM) tarixi. Joriy qiymat — {@code effective_from <= bugun}
 * bo'lgan eng so'nggi yozuv. Jadval V13 migratsiyasida yaratiladi.
 */
@Entity
@Table(name = "bhm_rates", indexes = {
        @Index(name = "idx_bhm_rates_effective_from", columnList = "effective_from")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BhmRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** BHM miqdori, so'mda. */
    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
