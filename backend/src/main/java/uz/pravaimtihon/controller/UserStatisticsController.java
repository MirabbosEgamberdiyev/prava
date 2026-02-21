package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.StatisticsFilterRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.ComprehensiveStatisticsResponse;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.ComprehensiveStatisticsService;
import uz.pravaimtihon.service.DeviceManagementService;

import java.time.LocalDateTime;

/**
 * User Statistika Controller - Foydalanuvchi o'z statistikasini ko'rish.
 */
@RestController
@RequestMapping("/api/v2/my-statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
@Tag(name = "My Statistics", description = "Mening mukammal statistikam - barcha filterlar bilan")
public class UserStatisticsController {

    private final ComprehensiveStatisticsService statisticsService;
    private final DeviceManagementService deviceService;

    // ============================================
    // TO'LIQ STATISTIKA
    // ============================================

    @GetMapping
    @Operation(
            summary = "Mening to'liq statistikam",
            description = "Barcha imtihonlar, paketlar, biletlar va marathon statistikasi"
    )
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyFullStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/filter")
    @Operation(
            summary = "Filter bilan statistikam",
            description = """
                    O'z statistikangizni filter bilan olish.

                    **Filter imkoniyatlari:**
                    - `packageId` - ma'lum paket uchun
                    - `ticketId` - ma'lum bilet uchun
                    - `topicId` - ma'lum mavzu uchun
                    - `mode` - ALL, MARATHON, TICKET, PACKAGE
                    - `fromDate`, `toDate` - vaqt oralig'i
                    """
    )
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyFilteredStatistics(
            @RequestBody StatisticsFilterRequest filter,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        // userId ni o'rnatmaslik - service o'zi joriy userni oladi
        filter.setUserId(null);

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // PAKET BO'YICHA
    // ============================================

    @GetMapping("/package/{packageId}")
    @Operation(summary = "Paket bo'yicha statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyPackageStatistics(
            @PathVariable Long packageId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .packageId(packageId)
                .mode(StatisticsFilterRequest.ExamMode.PACKAGE)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // BILET BO'YICHA
    // ============================================

    @GetMapping("/ticket/{ticketId}")
    @Operation(summary = "Bilet bo'yicha statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyTicketStatistics(
            @PathVariable Long ticketId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .ticketId(ticketId)
                .mode(StatisticsFilterRequest.ExamMode.TICKET)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // MAVZU BO'YICHA
    // ============================================

    @GetMapping("/topic/{topicId}")
    @Operation(summary = "Mavzu bo'yicha statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyTopicStatistics(
            @PathVariable Long topicId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .topicId(topicId)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // MARATHON
    // ============================================

    @GetMapping("/marathon")
    @Operation(summary = "Marathon statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyMarathonStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .mode(StatisticsFilterRequest.ExamMode.MARATHON)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // VAQT BO'YICHA TEZKOR FILTERLAR
    // ============================================

    @GetMapping("/today")
    @Operation(summary = "Bugungi statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyTodayStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .fromDate(LocalDateTime.now().toLocalDate().atStartOfDay())
                .includeDetails(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/this-week")
    @Operation(summary = "Bu haftalik statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyThisWeekStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .fromDate(LocalDateTime.now().minusDays(7))
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/this-month")
    @Operation(summary = "Bu oylik statistikam")
    public ResponseEntity<ApiResponse<ComprehensiveStatisticsResponse>> getMyThisMonthStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .fromDate(LocalDateTime.now().minusDays(30))
                .includeDetails(true)
                .includeTrend(true)
                .build();

        ComprehensiveStatisticsResponse response = statisticsService.getMyStatistics(filter, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // QURILMALAR
    // ============================================

    @GetMapping("/devices")
    @Operation(summary = "Mening qurilmalarim haqida ma'lumot")
    public ResponseEntity<ApiResponse<AdminStatisticsController.DeviceInfoResponse>> getMyDeviceInfo() {
        Long userId = uz.pravaimtihon.security.SecurityUtils.getCurrentUserId();
        AdminStatisticsController.DeviceInfoResponse response = deviceService.getDeviceInfo(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
