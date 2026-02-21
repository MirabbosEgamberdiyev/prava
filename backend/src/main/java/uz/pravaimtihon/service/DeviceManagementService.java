package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.controller.AdminStatisticsController.DeviceInfoResponse;
import uz.pravaimtihon.dto.response.GlobalDeviceLimitResponse;
import uz.pravaimtihon.entity.RefreshToken;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Qurilma boshqaruvi servisi.
 * Har bir foydalanuvchi uchun maksimal qurilmalar sonini boshqaradi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceManagementService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Maksimal qurilmalar sonini o'rnatish (individual user uchun).
     * Bu user uchun global o'zgarish ta'sir qilmaydi.
     */
    @Transactional
    public void setMaxDevices(Long userId, Integer maxDevices) {
        if (maxDevices < 1 || maxDevices > 10) {
            throw new BusinessException("validation.deviceLimit.maxDevices.range");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        user.setMaxDevices(maxDevices);
        user.setDeviceLimitCustomized(true); // Bu user uchun global o'zgarish ta'sir qilmaydi

        // Agar hozirgi qurilmalar soni yangi limitdan oshsa, eng eskilarini o'chirish
        if (user.getActiveDeviceCount() != null && user.getActiveDeviceCount() > maxDevices) {
            int toRemove = user.getActiveDeviceCount() - maxDevices;
            removeOldestDevices(userId, toRemove);
            user.setActiveDeviceCount(maxDevices);
        }

        userRepository.save(user);

        log.info("User {} max devices set to {} (customized=true)", userId, maxDevices);
    }

    /**
     * Global device limit o'rnatish.
     * Faqat customized=false bo'lgan userlar uchun o'zgaradi.
     * Individual o'rnatilgan limitlar saqlanib qoladi.
     */
    @Transactional
    public GlobalDeviceLimitResponse setGlobalDeviceLimit(Integer maxDevices) {
        if (maxDevices < 1 || maxDevices > 10) {
            throw new BusinessException("validation.deviceLimit.maxDevices.range");
        }

        long customizedCount = userRepository.countCustomizedUsers();
        int updatedCount = userRepository.updateGlobalDeviceLimit(maxDevices);

        log.info("Global device limit set to {}. Updated {} users. {} users with custom limits unchanged.",
                maxDevices, updatedCount, customizedCount);

        return GlobalDeviceLimitResponse.builder()
                .newGlobalLimit(maxDevices)
                .updatedUsers(updatedCount)
                .skippedCustomizedUsers(customizedCount)
                .build();
    }

    /**
     * User limitini global ga qaytarish (customized ni olib tashlash).
     */
    @Transactional
    public void resetToGlobalLimit(Long userId, Integer globalLimit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        user.setMaxDevices(globalLimit);
        user.setDeviceLimitCustomized(false);
        userRepository.save(user);

        log.info("User {} reset to global limit {}", userId, globalLimit);
    }

    /**
     * Qurilma ma'lumotlarini olish.
     */
    @Transactional(readOnly = true)
    public DeviceInfoResponse getDeviceInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Haqiqiy faol tokenlar sonini hisoblash
        int actualActiveCount = refreshTokenRepository.countActiveTokensByUserId(userId, LocalDateTime.now());

        return DeviceInfoResponse.builder()
                .userId(user.getId())
                .userName(user.getFullName())
                .maxDevices(user.getMaxDevices())
                .activeDevices(actualActiveCount)
                .remainingSlots(Math.max(0, user.getMaxDevices() - actualActiveCount))
                .build();
    }

    /**
     * Barcha qurilma sessiyalarini bekor qilish (logout all).
     */
    @Transactional
    public void resetAllDevices(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Barcha refresh tokenlarni o'chirish
        refreshTokenRepository.deleteAllByUserId(userId);

        // Counter ni nolga tushirish
        user.setActiveDeviceCount(0);
        userRepository.save(user);

        log.info("All device sessions reset for user {}", userId);
    }

    /**
     * Yangi qurilma qo'shish mumkinligini tekshirish.
     */
    @Transactional(readOnly = true)
    public boolean canAddNewDevice(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        int actualActiveCount = refreshTokenRepository.countActiveTokensByUserId(userId, LocalDateTime.now());

        return actualActiveCount < user.getMaxDevices();
    }

    /**
     * Yangi qurilma sessiyasini ro'yxatdan o'tkazish.
     * Login paytida chaqiriladi.
     */
    @Transactional
    public void registerNewDevice(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        int actualActiveCount = refreshTokenRepository.countActiveTokensByUserId(userId, LocalDateTime.now());

        if (actualActiveCount >= user.getMaxDevices()) {
            // Eng eski sessiyani o'chirish
            removeOldestDevices(userId, 1);
        }

        user.incrementActiveDevices();
        userRepository.save(user);

        log.info("New device registered for user {}. Active: {}/{}",
                userId, user.getActiveDeviceCount(), user.getMaxDevices());
    }

    /**
     * Qurilma sessiyasini bekor qilish.
     * Logout paytida chaqiriladi.
     */
    @Transactional
    public void unregisterDevice(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        user.decrementActiveDevices();
        userRepository.save(user);

        log.info("Device unregistered for user {}. Active: {}/{}",
                userId, user.getActiveDeviceCount(), user.getMaxDevices());
    }

    /**
     * Eng eski qurilmalarni o'chirish.
     */
    private void removeOldestDevices(Long userId, int count) {
        List<RefreshToken> tokens = refreshTokenRepository.findOldestActiveTokensByUserId(
                userId, LocalDateTime.now(), PageRequest.of(0, count));

        for (RefreshToken token : tokens) {
            token.setIsRevoked(true);
            refreshTokenRepository.save(token);
        }

        log.info("Removed {} oldest devices for user {}", tokens.size(), userId);
    }

    /**
     * Foydalanuvchi qurilmalari limitini yangi user uchun sozlash.
     */
    @Transactional
    public void initializeDeviceSettings(User user) {
        if (user.getMaxDevices() == null) {
            user.setMaxDevices(4); // Default 4 ta qurilma
        }
        if (user.getActiveDeviceCount() == null) {
            user.setActiveDeviceCount(0);
        }
    }
}
