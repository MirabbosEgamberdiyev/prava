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
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.StatisticsService;

import java.util.List;

/**
 * ✅ Admin Dashboard Controller - To'liq Multi-Language + Pagination + i18n
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@Tag(name = "Admin Dashboard", description = "Admin panel statistikasi va hisobotlar")
public class AdminDashboardController {

    private final StatisticsService statisticsService;
    private final MessageService messageService;

    /**
     * ✅ Dashboard statistikasini olish - Multi-language qo'llab-quvvatlash
     * GET /api/v1/admin/dashboard/stats
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/stats")
    @Operation(
            summary = "Dashboard statistikasi",
            description = "Umumiy statistika: foydalanuvchilar, imtihonlar, o'rtacha ball."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Dashboard statistikasi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "data": {
                                        "totalUsers": 1500,
                                        "totalExams": 8500,
                                        "todayExams": 125,
                                        "activeExams": 15,
                                        "averageScore": 72.5,
                                        "passRate": 68.3,
                                        "totalQuestions": 2000,
                                        "totalPackages": 50
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autentifikatsiya talab qilinadi"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Ruxsat yo'q - faqat ADMIN/SUPER_ADMIN")
    })
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        DashboardStatsResponse response = statisticsService.getDashboardStats(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Get topic statistics - Multi-language support
     * GET /api/v1/admin/dashboard/topics
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/topics")
    @Operation(summary = "Get topic statistics", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<TopicStatsResponse>>> getTopicStats(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicStatsResponse> response = statisticsService.getTopicStats(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ FIXED: Get recent exams with FULL pagination support
     * GET /api/v1/admin/dashboard/recent-exams?page=0&size=10&sortBy=startedAt&direction=DESC
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/recent-exams")
    @Operation(summary = "Get recent exams with pagination", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getRecentExams(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size", example = "10")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sort field", example = "startedAt")
            @RequestParam(defaultValue = "startedAt") String sortBy,

            @Parameter(description = "Sort direction: ASC|DESC", example = "DESC")
            @RequestParam(defaultValue = "DESC") String direction,

            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        // Create sort direction
        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // Create pageable with sorting
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        // Get paginated results
        PageResponse<ExamSessionResponse> response = statisticsService.getRecentExams(pageable, language);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Get user exam history by user ID (Admin view)
     * GET /api/v1/admin/dashboard/user/{userId}/exams?page=0&size=20
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/user/{userId}/exams")
    @Operation(summary = "Get user exam history (Admin)", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getUserExamHistory(
            @PathVariable Long userId,

            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Sort field", example = "startedAt")
            @RequestParam(defaultValue = "startedAt") String sortBy,

            @Parameter(description = "Sort direction: ASC|DESC", example = "DESC")
            @RequestParam(defaultValue = "DESC") String direction,

            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<ExamSessionResponse> response = statisticsService.getUserExamHistory(userId, pageable, language);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Get user statistics by user ID (Admin view)
     * GET /api/v1/admin/dashboard/user/{userId}/statistics
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/user/{userId}/statistics")
    @Operation(summary = "Get user statistics (Admin)", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<UserStatisticsResponse>>> getUserStatistics(
            @PathVariable Long userId,

            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<UserStatisticsResponse> response = statisticsService.getUserStatistics(userId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Get active exams count
     * GET /api/v1/admin/dashboard/active-exams-count
     */
    @GetMapping("/active-exams-count")
    @Operation(summary = "Get active exams count")
    public ResponseEntity<ApiResponse<Long>> getActiveExamsCount(
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        long count = statisticsService.getActiveExamsCount();
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.admin.active.exams.count", language), count));
    }

    /**
     * ✅ Get completed exams count
     * GET /api/v1/admin/dashboard/completed-exams-count
     */
    @GetMapping("/completed-exams-count")
    @Operation(summary = "Get completed exams count")
    public ResponseEntity<ApiResponse<Long>> getCompletedExamsCount(
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        long count = statisticsService.getCompletedExamsCount();
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.admin.completed.exams.count", language), count));
    }

    /**
     * ✅ Get today's exams count
     * GET /api/v1/admin/dashboard/today-exams-count
     */
    @GetMapping("/today-exams-count")
    @Operation(summary = "Get today's exams count")
    public ResponseEntity<ApiResponse<Long>> getTodayExamsCount(
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        long count = statisticsService.getTodayExamsCount();
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.admin.today.exams.count", language), count));
    }
}