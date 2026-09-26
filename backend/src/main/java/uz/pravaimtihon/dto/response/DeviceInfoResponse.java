package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** Foydalanuvchi qurilmalari haqida ma'lumot (admin va foydalanuvchining o'zi uchun). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceInfoResponse {
    private Long userId;
    private String userName;
    private Integer maxDevices;
    private Integer activeDevices;
    private Integer remainingSlots;
    /** Faqat foydalanuvchining o'z so'rovida (/api/v2/my-statistics/devices) to'ldiriladi. */
    private List<DeviceItem> devices;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceItem {
        /** Qurilma sessiyasi ID (refresh token family). */
        private String deviceId;
        private String deviceName;
        private LocalDateTime lastActiveAt;
        private Boolean isCurrent;
    }
}
