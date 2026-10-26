package uz.pravaimtihon.payment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.config.PaymentProperties;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.entity.UserPackageAccess;
import uz.pravaimtihon.payment.repository.UserPackageAccessRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentAccessServiceTest {

    @Mock
    private UserPackageAccessRepository accessRepo;

    private PaymentProperties props;
    private PaymentAccessService accessService;

    @BeforeEach
    void setUp() {
        props = new PaymentProperties();
        props.setAccessDays(30);
        accessService = new PaymentAccessService(accessRepo, props);
    }

    @Test
    @DisplayName("Package 7 (1 kun, 5 000 UZS) should grant 1-day access")
    void testGrantOneDayPackage() {
        User user = User.builder().build();
        user.setId(42L);

        ExamPackage pkg = ExamPackage.builder()
                .nameUzl("1 kun")
                .price(BigDecimal.valueOf(5000))
                .build();
        pkg.setId(7L);

        Payment payment = Payment.builder().build();
        payment.setId(101L);

        when(accessRepo.findByUserIdAndPackageId(42L, 7L)).thenReturn(Optional.empty());
        when(accessRepo.saveAndFlush(any(UserPackageAccess.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPackageAccess granted = accessService.grant(user, pkg, payment);

        assertThat(granted).isNotNull();
        assertThat(granted.getUser()).isEqualTo(user);
        assertThat(granted.getExamPackage()).isEqualTo(pkg);
        assertThat(granted.getExpiresAt()).isNotNull();

        long hoursUntilExpiry = ChronoUnit.HOURS.between(LocalDateTime.now(), granted.getExpiresAt());
        assertThat(hoursUntilExpiry).isBetween(23L, 25L);
    }

    @Test
    @DisplayName("Package 1 (1 hafta) should grant 7-day access")
    void testGrantOneWeekPackage() {
        User user = User.builder().build();
        user.setId(42L);

        ExamPackage pkg = ExamPackage.builder()
                .nameUzl("1 hafta")
                .price(BigDecimal.valueOf(19000))
                .build();
        pkg.setId(1L);

        Payment payment = Payment.builder().build();
        payment.setId(102L);

        when(accessRepo.findByUserIdAndPackageId(42L, 1L)).thenReturn(Optional.empty());
        when(accessRepo.saveAndFlush(any(UserPackageAccess.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPackageAccess granted = accessService.grant(user, pkg, payment);

        assertThat(granted).isNotNull();
        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDateTime.now(), granted.getExpiresAt());
        assertThat(daysUntilExpiry).isEqualTo(7L);
    }

    @Test
    @DisplayName("enrichUserSubscription sets 1 kun plan title for active 1-day access")
    void testEnrichUserSubscription() {
        User user = User.builder().email("student@test.uz").build();
        user.setId(42L);
        UserResponse response = new UserResponse();

        ExamPackage pkg = ExamPackage.builder()
                .nameUzl("1 kun")
                .build();
        pkg.setId(7L);

        UserPackageAccess access = UserPackageAccess.builder()
                .user(user)
                .examPackage(pkg)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();
        access.setId(1L);

        when(accessRepo.findActiveAccesses(42L)).thenReturn(Collections.singletonList(access));

        accessService.enrichUserSubscription(response, user);

        assertThat(response.getHasSubscription()).isTrue();
        assertThat(response.getPackageActive()).isTrue();
        assertThat(response.getSubscriptionPlan()).isEqualTo("1 kun");
    }
}
