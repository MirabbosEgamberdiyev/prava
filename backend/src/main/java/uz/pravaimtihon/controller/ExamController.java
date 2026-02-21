package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.MarathonExamRequest;
import uz.pravaimtihon.dto.request.StartExamRequest;
import uz.pravaimtihon.dto.request.SubmitAllAnswersRequest;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.ExamService;

/**
 * ✅ Imtihon Controller V1 - To'liq Multi-Language + Pagination qo'llab-quvvatlash
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 *
 * @deprecated V2 ga o'ting (/api/v2/exams) - Yangi arxitektura, multi-tab safe
 */
@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
@Tag(name = "Exam Management V1", description = "Imtihon boshlash, javob topshirish, tarix (V2 ni ishlating)")
public class ExamController {

    private final ExamService examService;
    private final MessageService messageService;

    /**
     * ✅ Start new exam - Multi-language support
     * POST /api/v1/exams/start
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @PostMapping("/start")
    @Operation(summary = "Start New Exam Session",
            description = "Start a new exam session for the specified package. " +
                    "Request body must include packageId and language. Multi-language: UZL, UZC, EN, RU")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Exam started successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "User already has an active exam session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Package not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Validation error - packageId and language required")
    })
    public ResponseEntity<ApiResponse<ExamStartResponse>> startExam(
            @Valid @RequestBody StartExamRequest request,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamStartResponse response = examService.startExam(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.exam.started", language), response));
    }

    /**
     * ✅ MARATHON MODE - Practice with dynamic question sets
     * POST /api/v1/exams/marathon
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @PostMapping("/marathon")
    @Operation(summary = "Start Marathon Mode Exam",
            description = "Start a practice exam with dynamically generated questions. " +
                    "Marathon mode allows you to specify question count and optionally filter by topic. " +
                    "No predefined package required. Perfect for focused practice sessions.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Marathon exam started successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "User already has an active exam session"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Topic not found (if topicId specified)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Validation error or insufficient questions available")
    })
    public ResponseEntity<ApiResponse<ExamStartResponse>> startMarathonExam(
            @Valid @RequestBody MarathonExamRequest request,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamStartResponse response = examService.startMarathonExam(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.exam.marathon.started", language), response));
    }

    /**
     * ✅ Submit all answers - Multi-language support
     * POST /api/v1/exams/submit
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @PostMapping("/submit")
    @Operation(summary = "Submit Exam Answers",
            description = "Submit all answers for an active exam session. Returns the exam result with score and pass/fail status.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Exam submitted and graded successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid session or exam already submitted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<ApiResponse<ExamResultResponse>> submitAnswers(
            @Valid @RequestBody SubmitAllAnswersRequest request,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResultResponse response = examService.submitAllAnswers(request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.exam.submitted", language), response));
    }

    /**
     * ✅ Get exam result - Multi-language support
     * GET /api/v1/exams/{sessionId}/result
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/{sessionId}/result")
    @Operation(summary = "Get Exam Result",
            description = "Get the detailed result of a completed exam session including score, answers, and explanations.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Exam result retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Not authorized to view this exam result"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<ApiResponse<ExamResultResponse>> getResult(
            @PathVariable Long sessionId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResultResponse response = examService.getExamResult(sessionId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ FIXED: Get exam history with FULL pagination
     * GET /api/v1/exams/history?page=0&size=20&sortBy=startedAt&direction=DESC
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/history")
    @Operation(summary = "Get Exam History",
            description = "Get paginated list of user's exam sessions with sorting options.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Exam history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getHistory(
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

        PageResponse<ExamSessionResponse> response = examService.getExamHistory(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ FIXED: Get exam history by status with FULL pagination
     * GET /api/v1/exams/history/status/{status}?page=0&size=20
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/history/status/{status}")
    @Operation(summary = "Get Exam History by Status",
            description = "Get paginated list of user's exam sessions filtered by status (COMPLETED, IN_PROGRESS, ABANDONED, etc.)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Exam history retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ApiResponse<PageResponse<ExamSessionResponse>>> getHistoryByStatus(
            @PathVariable ExamStatus status,

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

        PageResponse<ExamSessionResponse> response = examService.getExamHistoryByStatus(
                status, pageable, language
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Get exam history summary - Multi-language support
     * GET /api/v1/exams/history/summary
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/history/summary")
    @Operation(summary = "Get Exam History Summary",
            description = "Get aggregated statistics: total exams, pass rate, average score, etc.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Summary retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ApiResponse<ExamHistoryResponse>> getHistorySummary(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamHistoryResponse response = examService.getExamHistorySummary(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Get current active exam - Multi-language support
     * GET /api/v1/exams/active
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/active")
    @Operation(summary = "Get Active Exam Session",
            description = "Get the currently active (in-progress) exam session for the user. Returns null if no active exam.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Active exam retrieved or null if none"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ApiResponse<ExamStartResponse>> getActiveExam(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamStartResponse response = examService.getActiveExam(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ Check if user has active exam
     * GET /api/v1/exams/has-active
     */
    @GetMapping("/has-active")
    @Operation(summary = "Check Active Exam Status",
            description = "Check if the user has an active (in-progress) exam session. Returns true/false.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Status checked successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<ApiResponse<Boolean>> hasActiveExam() {
        boolean hasActive = examService.hasActiveExam();
        return ResponseEntity.ok(ApiResponse.success(hasActive));
    }

    /**
     * ✅ Abandon exam
     * DELETE /api/v1/exams/{sessionId}/abandon
     */
    @DeleteMapping("/{sessionId}/abandon")
    @Operation(summary = "Abandon Exam Session",
            description = "Abandon an in-progress exam session. The exam will be marked as ABANDONED and cannot be resumed.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Exam abandoned successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Exam is not in progress or already completed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Not authorized to abandon this exam"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<ApiResponse<Void>> abandonExam(
            @PathVariable Long sessionId,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        examService.abandonExam(sessionId);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.exam.abandoned", language), null));
    }

    /**
     * ✅ Get exam statistics
     * GET /api/v1/exams/{sessionId}/statistics
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/{sessionId}/statistics")
    @Operation(summary = "Get Exam Session Statistics",
            description = "Get detailed statistics for a specific exam session including time spent, topic breakdown, etc.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Not authorized to view this exam's statistics"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Session not found")
    })
    public ResponseEntity<ApiResponse<ExamStatisticsResponse>> getExamStatistics(
            @PathVariable Long sessionId,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamStatisticsResponse response = examService.getExamStatistics(sessionId, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}