package uz.pravaimtihon.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.entity.UserPackageAccess;
import uz.pravaimtihon.payment.repository.UserPackageAccessRepository;

import java.time.LocalDateTime;

/**
 * Idempotent grant/revoke of package access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentAccessService {

    private final UserPackageAccessRepository accessRepo;
    private final PaymentProperties           props;

    @Transactional(propagation = Propagation.REQUIRED)
    public UserPackageAccess grant(User user, ExamPackage pkg, Payment payment) {
        return accessRepo.findByUserIdAndPackageId(user.getId(), pkg.getId())
                .map(existing -> {
                    if (Boolean.TRUE.equals(existing.getRevoked())) {
                        existing.setRevoked(false);
                        existing.setRevokedAt(null);
                        existing.setRevokeReason(null);
                    }
                    existing.setPayment(payment);
                    existing.setGrantedAt(LocalDateTime.now());
                    existing.setExpiresAt(computeExpiry());
                    log.info("[payment] re-granted access userId={} packageId={} via paymentId={}",
                            user.getId(), pkg.getId(), payment != null ? payment.getId() : null);
                    return existing;
                })
                .orElseGet(() -> {
                    try {
                        UserPackageAccess created = UserPackageAccess.builder()
                                .user(user)
                                .examPackage(pkg)
                                .payment(payment)
                                .grantedAt(LocalDateTime.now())
                                .expiresAt(computeExpiry())
                                .revoked(false)
                                .build();
                        return accessRepo.saveAndFlush(created);
                    } catch (DataIntegrityViolationException race) {
                        // Two webhooks landed at once — the other one won. Load & return.
                        return accessRepo.findByUserIdAndPackageId(user.getId(), pkg.getId())
                                .orElseThrow(() -> race);
                    }
                });
    }

    @Transactional
    public void revoke(Long userId, Long packageId, String reason) {
        accessRepo.findByUserIdAndPackageId(userId, packageId).ifPresent(a -> {
            a.setRevoked(true);
            a.setRevokedAt(LocalDateTime.now());
            a.setRevokeReason(reason);
            log.info("[payment] revoked access userId={} packageId={} reason={}", userId, packageId, reason);
        });
    }

    @Transactional(readOnly = true)
    public boolean hasActiveAccess(Long userId, Long packageId) {
        return accessRepo.hasActiveAccess(userId, packageId);
    }

    private LocalDateTime computeExpiry() {
        Integer days = props.getAccessDays();
        return days == null ? null : LocalDateTime.now().plusDays(days);
    }
}
