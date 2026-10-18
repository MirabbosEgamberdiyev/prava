package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.payment.repository.UserPackageAccessRepository;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.repository.UserSavedQuestionRepository;
import uz.pravaimtihon.repository.UserStatisticsRepository;
import uz.pravaimtihon.repository.UserWrongAnswerRepository;
import uz.pravaimtihon.simulator.repository.SimulatorSessionRepository;

/**
 * Foydalanuvchining o'z akkauntini o'chirishi (Google Play "Account Deletion" talabi).
 *
 * <ul>
 *   <li>O'quv ma'lumotlari BUTUNLAY o'chiriladi: imtihon sessiyalari (+javoblar), statistika, xatolar,
 *       saqlangan savollar, simulyator sessiyalari, paket ruxsatlari, barcha refresh tokenlar (sessiyalar).</li>
 *   <li>Shaxsiy ma'lumotlar (ism, telefon, e-mail, Google/Telegram ID, rasm, parol) anonimlashtiriladi va
 *       yozuv soft-delete qilinadi — to'lov yozuvlari (Payment) qonunchilik bo'yicha saqlanishi uchun
 *       FK sifatida qoladi, lekin endi hech kimga bog'lanmaydi.</li>
 * </ul>
 * Shu Google/Telegram akkaunt bilan qayta kirilsa — yangi, bo'sh akkaunt yaratiladi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    static final String DELETED_FIRST_NAME = "Deleted user";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserStatisticsRepository userStatisticsRepository;
    private final UserSavedQuestionRepository savedQuestionRepository;
    private final UserWrongAnswerRepository wrongAnswerRepository;
    private final UserPackageAccessRepository packageAccessRepository;
    private final SimulatorSessionRepository simulatorSessionRepository;

    @Transactional
    public void deleteOwnAccount(Long userId) {
        User user = userRepository.findById(userId)
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Xodimlar akkaunti ilovadan o'chirilmaydi (admin panel orqali boshqariladi)
        if (user.getRole() != Role.USER) {
            throw new ForbiddenException("error.permission.denied");
        }

        refreshTokenRepository.deleteAllByUserId(userId);
        savedQuestionRepository.deleteAllByUserId(userId);
        wrongAnswerRepository.deleteAllByUserId(userId);
        userStatisticsRepository.deleteAll(userStatisticsRepository.findByUserId(userId));
        packageAccessRepository.deleteAll(packageAccessRepository.findAllByUserId(userId));
        simulatorSessionRepository.deleteAll(simulatorSessionRepository.findByUserIdOrderByCreatedAtDesc(userId));
        if (user.getExamSessions() != null) {
            user.getExamSessions().clear(); // orphanRemoval → sessiyalar va javoblar o'chiriladi
        }
        if (user.getRefreshTokens() != null) {
            user.getRefreshTokens().clear();
        }

        anonymize(user);
        user.softDelete("self");
        userRepository.save(user);

        log.info("User {} deleted own account (data erased, profile anonymized)", userId);
    }

    static void anonymize(User user) {
        user.setFirstName(DELETED_FIRST_NAME);
        user.setLastName(null);
        user.setPhoneNumber(null);
        // validateUser() kamida bitta identifikator talab qiladi — unikal, yetkazib bo'lmaydigan manzil
        user.setEmail("deleted-" + user.getId() + "@deleted.invalid");
        user.setPasswordHash(null);
        user.setGoogleId(null);
        user.setTelegramId(null);
        user.setTelegramUsername(null);
        user.setProfileImageUrl(null);
        user.setIsActive(false);
        user.setIsEmailVerified(false);
        user.setIsPhoneVerified(false);
        user.setActiveDeviceCount(0);
    }
}
