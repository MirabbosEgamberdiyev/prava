// ============================================
// Statistika Controller - To'liq Swagger dokumentatsiyasi
// ============================================
package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.impl.StatisticsService;

import java.util.List;

/**
 * ✅ Statistika Controller - To'liq Multi-Language + i18n
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 */
@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
@Tag(name = "Statistics", description = "Foydalanuvchi statistikasi, leaderboard, imtihon tarixi")
public class StatisticsController {

    private final StatisticsService statisticsService;

    // ============================================
    // Mening Statistikam (User Statistics)
    // ============================================

    @GetMapping("/me")
    @Operation(
            summary = "Mening statistikam",
            description = "Barcha mavzular bo'yicha imtihon natijalari va o'rtacha ball."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistika muvaffaqiyatli qaytarildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "data": [
                                        {
                                          "topicCode": "YHQ",
                                          "topicName": "Yo'l harakati qoidalari",
                                          "totalExams": 15,
                                          "passedExams": 12,
                                          "averageScore": 78.5,
                                          "bestScore": 95,
                                          "lastExamDate": "2024-01-20T15:30:00"
                                        }
                                      ]
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autentifikatsiya talab qilinadi")
    })
    public ResponseEntity<ApiResponse<List<UserStatisticsResponse>>> getMyStatistics(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<UserStatisticsResponse> response = statisticsService.getMyStatistics(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/topic/{topic}")
    @Operation(summary = "Get my statistics by topic", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<UserStatisticsResponse>> getMyStatisticsByTopic(
            @PathVariable String topic,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserStatisticsResponse response = statisticsService.getMyStatisticsByTopic(topic, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/dashboard")
    @Operation(
            summary = "Mening to'liq dashboard statistikam",
            description = "Paket, bilet va marathon statistikalari bilan birga. Multi-language: UZL, UZC, EN, RU"
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Dashboard statistikasi muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autentifikatsiya talab qilinadi")
    })
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getUserDashboard(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserDashboardResponse response = statisticsService.getUserDashboard(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // Leaderboard - With Pagination
    // ============================================

    @GetMapping("/leaderboard/{topic}")
    @Operation(summary = "Get leaderboard by topic with pagination", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<LeaderboardEntryResponse>>> getLeaderboard(
            @PathVariable String topic,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "bestScore") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "DESC") String direction,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<LeaderboardEntryResponse> response = statisticsService.getLeaderboard(topic, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/leaderboard/global")
    @Operation(summary = "Get global leaderboard with pagination", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<LeaderboardEntryResponse>>> getGlobalLeaderboard(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "bestScore") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "DESC") String direction,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<LeaderboardEntryResponse> response = statisticsService.getGlobalLeaderboard(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // Admin Statistics
    // ============================================

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Get dashboard statistics (Admin)", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        DashboardStatsResponse response = statisticsService.getDashboardStats(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/topics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Get topic statistics", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<TopicStatsResponse>>> getTopicStats(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicStatsResponse> response = statisticsService.getTopicStats(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Get user statistics (Admin)", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<UserStatisticsResponse>>> getUserStatistics(
            @PathVariable Long userId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<UserStatisticsResponse> response = statisticsService.getUserStatistics(userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/exams/recent")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Get recent exams with pagination", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getRecentExams(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "startedAt") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "DESC") String direction,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<ExamSessionResponse> response = statisticsService.getRecentExams(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // My Exam History - With Pagination
    // ============================================

    @GetMapping("/me/exams")
    @Operation(summary = "Get my exam history with pagination", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getMyExamHistory(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "startedAt") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "DESC") String direction,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<ExamSessionResponse> response = statisticsService.getMyExamHistory(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/exams/topic/{topic}")
    @Operation(summary = "Get my exams by topic with pagination", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getMyExamsByTopic(
            @PathVariable String topic,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));

        PageResponse<ExamSessionResponse> response = statisticsService.getMyExamsByTopic(topic, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}