package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.DeviceLimitRequest;
import uz.pravaimtihon.dto.request.StatisticsFilterRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.ComprehensiveStatisticsResponse;
import uz.pravaimtihon.dto.response.GlobalDeviceLimitResponse;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.ComprehensiveStatisticsService;
import uz.pravaimtihon.service.DeviceManagementService;

import java.time.LocalDateTime;

/**
 * Admin Statistika Controller - Mukammal statistika endpointlari.
 * Barcha filterlar bilan ishlash imkoniyati.
 */
@RestController
@RequestMapping("/api/v2/admin/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@Tag(name = "Admin Statistics", description = "Admin uchun mukammal statistika - barcha filterlar bilan")
public class AdminStatisticsController {

    private final ComprehensiveStatisticsService statisticsService;
    private final DeviceManagementService deviceService;

    // ============================================
    // UNIVERSAL FILTER ENDPOINT
    // ============================================

    @PostMapping("/filter")
    @Operation(
            summary = "Mukammal statistika - barcha filterlar bilan",
            description = """
                    Barcha statistika turlarini bitta endpoint orqali olish.

                    **Filter imkoniyatlari:**
                    - `userId` - ma'lum foydalanuvchi uchun
                    - `packageId` - ma'lum paket uchun
                    - `ticketId` - ma'lum bilet uchun
                    - `topicId` - ma'lum mavzu uchun
                    - `mode` - ALL, MARATHON, TICKET, PACKAGE
                    - `fromDate`, `toDate` - vaqt oralig'i
                    - `completedOnly` - faqat tugatilganlar
                    - `passedOnly` - faqat muvaffaqiyatlilar

                    **Qo'shimcha:**
                    - `includeDetails` - batafsil ma'lumotlar (default: true)
                    - `includeTrend` - trend ma'lumotlari (default: false)
                    """
    )
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getFilteredStatistics(
            @RequestBody StatisticsFilterRequest filter,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // USER-SPECIFIC ENDPOINTS
    // ============================================

    @GetMapping("/user/{userId}")
    @Operation(summary = "Foydalanuvchi statistikasi", description = "Ma'lum foydalanuvchining to'liq statistikasi")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getUserStatistics(
            @PathVariable Long userId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getUserStatistics(userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}/package/{packageId}")
    @Operation(summary = "Foydalanuvchi + Paket statistikasi")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getUserPackageStatistics(
            @PathVariable Long userId,
            @PathVariable Long packageId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getPackageStatistics(packageId, userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}/ticket/{ticketId}")
    @Operation(summary = "Foydalanuvchi + Bilet statistikasi")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getUserTicketStatistics(
            @PathVariable Long userId,
            @PathVariable Long ticketId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getTicketStatistics(ticketId, userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}/topic/{topicId}")
    @Operation(summary = "Foydalanuvchi + Mavzu statistikasi")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getUserTopicStatistics(
            @PathVariable Long userId,
            @PathVariable Long topicId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getTopicStatistics(topicId, userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}/marathon")
    @Operation(summary = "Foydalanuvchi Marathon statistikasi")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getUserMarathonStatistics(
            @PathVariable Long userId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getMarathonStatistics(userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // GLOBAL STATISTICS (NO USER FILTER)
    // ============================================

    @GetMapping("/package/{packageId}")
    @Operation(summary = "Paket statistikasi (barcha foydalanuvchilar)")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getPackageStatistics(
            @PathVariable Long packageId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getPackageStatistics(packageId, null, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/ticket/{ticketId}")
    @Operation(summary = "Bilet statistikasi (barcha foydalanuvchilar)")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getTicketStatistics(
            @PathVariable Long ticketId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getTicketStatistics(ticketId, null, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/topic/{topicId}")
    @Operation(summary = "Mavzu statistikasi (barcha foydalanuvchilar)")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getTopicStatistics(
            @PathVariable Long topicId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getTopicStatistics(topicId, null, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/marathon")
    @Operation(summary = "Marathon statistikasi (barcha foydalanuvchilar)")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMarathonStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ComprehensiveStatisticsResponse response = statisticsService.getMarathonStatistics(null, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // QUICK FILTERS
    // ============================================

    @GetMapping("/today")
    @Operation(summary = "Bugungi statistika")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getTodayStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .fromDate(LocalDateTime.now().toLocalDate().atStartOfDay())
                .includeDetails(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/this-week")
    @Operation(summary = "Bu haftalik statistika")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getThisWeekStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .fromDate(LocalDateTime.now().minusDays(7))
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/this-month")
    @Operation(summary = "Bu oylik statistika")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getThisMonthStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .fromDate(LocalDateTime.now().minusDays(30))
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // DEVICE MANAGEMENT
    // ============================================

    @PostMapping("/device-limit")
    @Operation(
            summary = "Qurilma limitini sozlash",
            description = "Foydalanuvchi uchun maksimal qurilmalar sonini belgilash (1-10)"
    )
    public ResponseEntity<ApiResponse<String>> setDeviceLimit(
            @RequestBody DeviceLimitRequest request,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        deviceService.setMaxDevices(request.getUserId(), request.getMaxDevices());
        return ResponseEntity.ok(ApiResponse.success("success.device.limit.updated"));
    }

    @GetMapping("/device-limit/{userId}")
    @Operation(summary = "Qurilma limiti ma'lumotlari")
    public ResponseEntity<ApiResponse<DeviceInfoResponse>> getDeviceInfo(
            @PathVariable Long userId) {

        DeviceInfoResponse response = deviceService.getDeviceInfo(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/device-limit/{userId}/reset")
    @Operation(summary = "Qurilma sessiyalarini qayta tiklash (logout all)")
    public ResponseEntity<ApiResponse<String>> resetDeviceSessions(
            @PathVariable Long userId) {

        deviceService.resetAllDevices(userId);
        return ResponseEntity.ok(ApiResponse.success("success.device.sessions.reset"));
    }

    @PostMapping("/device-limit/global")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(
            summary = "Global qurilma limitini o'rnatish",
            description = """
                    Barcha foydalanuvchilar uchun default qurilma limitini o'rnatish.

                    **Muhim:** Individual o'rnatilgan limitlar (userId orqali) o'zgarmaydi.
                    Faqat customized=false bo'lgan userlar yangilanadi.
                    """
    )
    public ResponseEntity<ApiResponse<GlobalDeviceLimitResponse>> setGlobalDeviceLimit(
            @Parameter(description = "Yangi global limit (1-10)", example = "4")
            @RequestParam Integer maxDevices) {

        GlobalDeviceLimitResponse response = deviceService.setGlobalDeviceLimit(maxDevices);
        return ResponseEntity.ok(ApiResponse.success("Global device limit updated", response));
    }

    @PostMapping("/device-limit/{userId}/reset-to-global")
    @Operation(
            summary = "User limitini global ga qaytarish",
            description = "Individual o'rnatilgan limitni olib tashlab, global limitga qaytarish"
    )
    public ResponseEntity<ApiResponse<String>> resetUserToGlobalLimit(
            @PathVariable Long userId,
            @Parameter(description = "Hozirgi global limit qiymati", example = "4")
            @RequestParam Integer globalLimit) {

        deviceService.resetToGlobalLimit(userId, globalLimit);
        return ResponseEntity.ok(ApiResponse.success("User reset to global limit"));
    }

    // ============================================
    // INNER CLASSES
    // ============================================

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DeviceInfoResponse {
        private Long userId;
        private String userName;
        private Integer maxDevices;
        private Integer activeDevices;
        private Integer remainingSlots;
    }
}
