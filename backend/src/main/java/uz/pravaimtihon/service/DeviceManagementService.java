package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.response.DeviceInfoResponse;
import uz.pravaimtihon.security.SessionRevocationService;
import uz.pravaimtihon.dto.response.GlobalDeviceLimitResponse;
import uz.pravaimtihon.entity.RefreshToken;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    private final SessionRevocationService sessionRevocationService;

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
     * Foydalanuvchining o'z qurilmalari ro'yxati (har bir refresh token family = bitta qurilma).
     *
     * @param currentSessionId joriy so'rov access token'idagi {@code sid} (bo'lmasa null)
     */
    @Transactional(readOnly = true)
    public DeviceInfoResponse getMyDevices(Long userId, String currentSessionId) {
        DeviceInfoResponse info = getDeviceInfo(userId);
        Map<String, RefreshToken> latestByFamily = new LinkedHashMap<>();
        for (RefreshToken t : refreshTokenRepository.findActiveTokensByUserId(userId, LocalDateTime.now())) {
            latestByFamily.putIfAbsent(t.getTokenFamily(), t); // so'rov createdAt DESC — birinchisi eng yangisi
        }
        List<DeviceInfoResponse.DeviceItem> devices = latestByFamily.values().stream()
                .map(t -> DeviceInfoResponse.DeviceItem.builder()
                        .deviceId(t.getTokenFamily())
                        .deviceName(describeUserAgent(t.getUserAgent()))
                        .lastActiveAt(t.getLastUsedAt() != null ? t.getLastUsedAt() : t.getCreatedAt())
                        .isCurrent(t.getTokenFamily().equals(currentSessionId))
                        .build())
                .toList();
        info.setDevices(devices);
        info.setActiveDevices(devices.size());
        info.setRemainingSlots(Math.max(0, info.getMaxDevices() - devices.size()));
        return info;
    }

    /**
     * Foydalanuvchi o'z qurilma sessiyasini yopadi. Boshqa foydalanuvchining sessiyasi
     * bo'lsa ham "topilmadi" qaytariladi (mavjudligini oshkor qilmaslik uchun).
     */
    @Transactional
    public void revokeMyDevice(Long userId, String deviceId) {
        List<RefreshToken> tokens = refreshTokenRepository.findActiveTokensByFamily(deviceId, LocalDateTime.now());
        boolean owned = !tokens.isEmpty() && tokens.stream().allMatch(t -> t.getUser().getId().equals(userId));
        if (!owned) {
            throw new ResourceNotFoundException("error.device.not.found");
        }
        refreshTokenRepository.revokeAllByFamily(deviceId, LocalDateTime.now());
        sessionRevocationService.evict(deviceId);
        log.info("User {} revoked device session", userId);
    }

    private static String describeUserAgent(String ua) {
        if (ua == null || ua.isBlank()) return "Unknown device";
        String os = ua.contains("Android") ? "Android"
                : ua.contains("iPhone") || ua.contains("iPad") ? "iOS"
                : ua.contains("Windows") ? "Windows"
                : ua.contains("Mac OS") ? "macOS"
                : ua.contains("Linux") ? "Linux" : null;
        String client = ua.contains("okhttp") || ua.contains("Expo") || ua.contains("PravaOnline") ? "App"
                : ua.contains("Edg/") ? "Edge"
                : ua.contains("Chrome/") ? "Chrome"
                : ua.contains("Firefox/") ? "Firefox"
                : ua.contains("Safari/") ? "Safari" : null;
        if (os == null && client == null) return ua.length() > 40 ? ua.substring(0, 40) : ua;
        return (client != null ? client : "Browser") + (os != null ? " · " + os : "");
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
