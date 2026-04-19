package uz.pravaimtihon.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.dto.PaymentStatusResponse;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;
import uz.pravaimtihon.payment.exception.PaymentException;
import uz.pravaimtihon.payment.repository.PaymentRepository;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Shared logic used by both Click and Payme services — creation of pending payments,
 * amount validation, user/package resolution, expiry sweep.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository     paymentRepo;
    private final UserRepository        userRepo;
    private final ExamPackageRepository packageRepo;
    private final PaymentAccessService  accessService;
    private final PaymentProperties     props;

    @Transactional
    public Payment createPending(User user, ExamPackage pkg, PaymentProvider provider) {
        guardPaymentAllowed(pkg);
        guardAlreadyOwned(user.getId(), pkg.getId());

        Payment p = Payment.builder()
                .user(user)
                .examPackage(pkg)
                .amount(pkg.getPrice())
                .provider(provider)
                .state(PaymentState.PENDING)
                .merchantOrderId(newMerchantOrderId(provider))
                .build();
        Payment saved = paymentRepo.save(p);
        log.info("[payment] created PENDING id={} userId={} packageId={} amount={} provider={}",
                saved.getId(), user.getId(), pkg.getId(), saved.getAmount(), provider);
        return saved;
    }

    public void guardPaymentAllowed(ExamPackage pkg) {
        if (Boolean.TRUE.equals(pkg.getIsFree()))
            throw PaymentException.badRequest("Package is free — payment not allowed");
        if (pkg.getPrice() == null || pkg.getPrice().signum() <= 0)
            throw PaymentException.badRequest("Package price not set");
        if (!Boolean.TRUE.equals(pkg.getIsActive()) || Boolean.TRUE.equals(pkg.getDeleted()))
            throw PaymentException.badRequest("Package is not available");
    }

    public void guardAlreadyOwned(Long userId, Long packageId) {
        if (accessService.hasActiveAccess(userId, packageId))
            throw PaymentException.conflict("User already has active access to this package");
    }

    public User requireUser(Long id) {
        return userRepo.findById(id).orElseThrow(() -> PaymentException.notFound("User not found: " + id));
    }

    public User requireUserByIdentifier(String identifier) {
        return userRepo.findByIdentifier(identifier)
                .orElseThrow(() -> PaymentException.notFound("User not found: " + identifier));
    }

    public ExamPackage requirePackage(Long id) {
        return packageRepo.findById(id).orElseThrow(() -> PaymentException.notFound("Package not found: " + id));
    }

    public Payment requirePayment(Long id) {
        return paymentRepo.findById(id).orElseThrow(() -> PaymentException.notFound("Payment not found: " + id));
    }

    public Payment requirePaymentForUpdate(Long id) {
        return paymentRepo.findByIdForUpdate(id)
                .orElseThrow(() -> PaymentException.notFound("Payment not found: " + id));
    }

    @Transactional(readOnly = true)
    public PaymentStatusResponse status(Long paymentId, Long userId) {
        Payment p = paymentRepo.findById(paymentId)
                .orElseThrow(() -> PaymentException.notFound("Payment not found"));
        if (!p.getUser().getId().equals(userId))
            throw PaymentException.forbidden("Not your payment");

        return PaymentStatusResponse.builder()
                .paymentId(p.getId())
                .merchantOrderId(p.getMerchantOrderId())
                .provider(p.getProvider())
                .state(p.getState())
                .amount(p.getAmount())
                .packageId(p.getExamPackage().getId())
                .createdAt(p.getCreatedAt())
                .paidAt(p.getPaidAt())
                .cancelledAt(p.getCancelledAt())
                .accessGranted(accessService.hasActiveAccess(userId, p.getExamPackage().getId()))
                .build();
    }

    @Transactional
    public int cancelExpiredPending() {
        LocalDateTime before = LocalDateTime.now().minusMinutes(props.getPendingTimeoutMinutes());
        var stale = paymentRepo.findStaleByState(PaymentState.PENDING, before);
        for (Payment p : stale) {
            p.setState(PaymentState.CANCELLED);
            p.setCancelledAt(LocalDateTime.now());
            log.info("[payment] auto-cancelled stale PENDING id={}", p.getId());
        }
        return stale.size();
    }

    public void assertAmountEquals(BigDecimal expectedSum, BigDecimal actualSum, String ctx) {
        if (expectedSum == null || actualSum == null
                || expectedSum.compareTo(actualSum) != 0) {
            throw PaymentException.badRequest(
                    "Amount mismatch (" + ctx + "): expected=" + expectedSum + ", got=" + actualSum);
        }
    }

    public PaymentRepository repository() {
        return paymentRepo;
    }

    private String newMerchantOrderId(PaymentProvider provider) {
        // short + unique + grepable
        return "PR-" + provider + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }
}
