package uz.pravaimtihon.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One-to-one payment record for a package purchase.
 * Amount is stored in SUM (so'm) — providers that use tiyin (Payme)
 * convert at service layer (x100 / /100).
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payments_user", columnList = "user_id"),
        @Index(name = "idx_payments_package", columnList = "package_id"),
        @Index(name = "idx_payments_merchant_order", columnList = "merchant_order_id"),
        @Index(name = "idx_payments_provider_tx", columnList = "provider, provider_transaction_id"),
        @Index(name = "idx_payments_state", columnList = "state")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    private ExamPackage examPackage;

    /**
     * Amount in UZS (so'm). Both Click and Payme payments store so'm here.
     */
    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 20)
    private PaymentState state;

    /**
     * Our order id. Stable unique key we send to providers.
     * For Click:  matches merchant_trans_id (string form of payment.id)
     * For Payme:  matches account[order_id]
     */
    @Column(name = "merchant_order_id", length = 100, unique = true)
    private String merchantOrderId;

    /**
     * Provider-side tx id.
     * Click:  click_trans_id
     * Payme:  params.id (24-char hex)
     */
    @Column(name = "provider_transaction_id", length = 100)
    private String providerTransactionId;

    /**
     * Click only — stored on prepare so complete is idempotent.
     */
    @Column(name = "merchant_prepare_id")
    private Long merchantPrepareId;

    /**
     * Payme only — state code 1/2/-1/-2 kept for protocol reply fidelity.
     */
    @Column(name = "payme_state_code")
    private Integer paymeStateCode;

    @Column(name = "payme_create_time")
    private Long paymeCreateTime;

    @Column(name = "payme_perform_time")
    private Long paymePerformTime;

    @Column(name = "payme_cancel_time")
    private Long paymeCancelTime;

    @Column(name = "payme_cancel_reason")
    private Integer paymeCancelReason;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "raw_last_request", columnDefinition = "TEXT")
    private String rawLastRequest;
}
