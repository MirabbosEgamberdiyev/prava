package uz.pravaimtihon.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.entity.UserPackageAccess;
import uz.pravaimtihon.payment.repository.UserPackageAccessRepository;

import java.time.LocalDateTime;
import java.util.List;

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
                    existing.setExpiresAt(computeExpiry(pkg, existing.getExpiresAt()));
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
                                .expiresAt(computeExpiry(pkg, null))
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

    /**
     * Alias for {@link #grant(User, ExamPackage, Payment)}.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public UserPackageAccess grantAccess(User user, ExamPackage pkg, Payment payment) {
        return grant(user, pkg, payment);
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

    @Transactional(readOnly = true)
    public boolean hasAnyActiveAccess(Long userId) {
        if (userId == null) return false;
        return accessRepo.hasAnyActiveAccess(userId);
    }

    @Transactional(readOnly = true)
    public void enrichUserSubscription(UserResponse response, User user) {
        if (response == null || user == null) return;

        // Superadmin / developer override
        if (user.getEmail() != null && "mirabbosegamberdiyev3@gmail.com".equalsIgnoreCase(user.getEmail().trim())) {
            response.setHasSubscription(true);
            response.setPackageActive(true);
            response.setSubscriptionPlan("1y");
            response.setSubscriptionExpiresAt(LocalDateTime.now().plusYears(1));
            return;
        }

        List<UserPackageAccess> activeList = accessRepo.findActiveAccesses(user.getId());
        if (!activeList.isEmpty()) {
            UserPackageAccess latest = activeList.get(0);
            response.setHasSubscription(true);
            response.setPackageActive(true);
            response.setSubscriptionExpiresAt(latest.getExpiresAt());
            response.setSubscriptionPlan(latest.getExamPackage() != null ? latest.getExamPackage().getNameUzl() : "PRO");
        } else {
            response.setHasSubscription(false);
            response.setPackageActive(false);
        }
    }

    private LocalDateTime computeExpiry(ExamPackage pkg, LocalDateTime base) {
        LocalDateTime start = (base != null && base.isAfter(LocalDateTime.now())) ? base : LocalDateTime.now();
        if (pkg == null) {
            Integer days = props.getAccessDays();
            return days == null ? null : start.plusDays(days);
        }

        Long id = pkg.getId();
        if (id != null) {
            if (id == 7L) return start.plusDays(1);
            if (id == 1L) return start.plusDays(7);
            if (id == 2L) return start.plusDays(14);
            if (id == 3L) return start.plusMonths(1);
            if (id == 4L) return start.plusMonths(3);
            if (id == 5L) return start.plusMonths(6);
            if (id == 6L) return start.plusYears(1);
        }

        String name = pkg.getNameUzl() != null ? pkg.getNameUzl().toLowerCase().trim() : "";
        if (name.contains("1 kun") || name.contains("kunlik") || name.contains("day")) {
            return start.plusDays(1);
        } else if (name.contains("2 hafta")) {
            return start.plusDays(14);
        } else if (name.contains("1 hafta") || name.contains("haftalik") || name.contains("week")) {
            return start.plusDays(7);
        } else if (name.contains("3 oy")) {
            return start.plusMonths(3);
        } else if (name.contains("6 oy")) {
            return start.plusMonths(6);
        } else if (name.contains("1 oy") || name.contains("oylik") || name.contains("month")) {
            return start.plusMonths(1);
        } else if (name.contains("1 yil") || name.contains("yillik") || name.contains("vip") || name.contains("year")) {
            return start.plusYears(1);
        }

        Integer days = props.getAccessDays();
        return days == null ? null : start.plusDays(days);
    }
}
