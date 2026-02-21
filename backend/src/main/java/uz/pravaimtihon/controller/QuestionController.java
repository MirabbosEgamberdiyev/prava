package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.request.BulkQuestionRequest;
import uz.pravaimtihon.dto.request.QuestionRequest;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.QuestionService;

import java.util.List;

/**
 * ✅ Savollar Boshqaruvi Controller - To'liq Multi-Language + i18n
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 */
@RestController
@RequestMapping("/api/v1/admin/questions")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@Tag(name = "Question Management", description = "Savollarni yaratish, tahrirlash, o'chirish, bulk import")
public class QuestionController {

    private final QuestionService questionService;
    private final MessageService messageService;

    @PostMapping(consumes = {"application/json"})
    @Operation(
            summary = "Savol yaratish (JSON)",
            description = "Yangi savol JSON formatda. Majburiy: textUzl, options (2-10 ta), correctAnswerIndex, topicId."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Savol muvaffaqiyatli yaratildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Savol muvaffaqiyatli yaratildi",
                                      "data": {
                                        "id": 1,
                                        "text": "Qaysi belgi to'xtash taqiqlangan joyni bildiradi?",
                                        "options": [
                                          {"id": 1, "text": "3.27 belgisi", "isCorrect": true},
                                          {"id": 2, "text": "3.28 belgisi", "isCorrect": false},
                                          {"id": 3, "text": "3.29 belgisi", "isCorrect": false},
                                          {"id": 4, "text": "3.30 belgisi", "isCorrect": false}
                                        ],
                                        "explanation": "3.27 belgisi to'xtash taqiqlangan joyni bildiradi",
                                        "topicCode": "YHQ",
                                        "difficulty": "MEDIUM",
                                        "isActive": true
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri so'rov"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Ruxsat yo'q"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Mavzu topilmadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Validatsiya xatosi"
            )
    })
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @Valid @RequestBody QuestionRequest request,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.createQuestion(request, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.question.created", language), response));
    }

    @PutMapping(value = "/{id}", consumes = {"application/json"})
    @Operation(summary = "Update question (JSON)", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.updateQuestion(id, request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.updated", language), response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete question")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.deleted", language), null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get question by ID", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestion(
            @PathVariable Long id,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.getQuestionById(id, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/detail")
    @Operation(summary = "Get question detail for editing", description = "Barcha 4 til varianti qaytariladi (admin edit uchun)")
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> getQuestionDetail(
            @PathVariable Long id) {

        QuestionDetailResponse response = questionService.getQuestionDetail(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Get all questions", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getAllQuestions(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "DESC") String direction,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<QuestionResponse> response = questionService.getAllQuestions(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/topic/{topicId}")
    @Operation(summary = "Get questions by topic", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getQuestionsByTopic(
            @PathVariable Long topicId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "DESC") String direction,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<QuestionResponse> response = questionService.getQuestionsByTopicId(topicId, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Search questions", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> searchQuestions(
            @Parameter(description = "Search query") @RequestParam String query,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Pageable pageable = PageRequest.of(page, size);
        PageResponse<QuestionResponse> response = questionService.searchQuestions(query, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Bulk import questions", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<BulkQuestionResponse>> bulkImport(
            @Valid @RequestBody BulkQuestionRequest request,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        BulkQuestionResponse response = questionService.bulkImportQuestions(request, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        messageService.getMessage("success.question.bulk.import", new Object[]{response.getSuccess(), response.getFailed()}, language),
                        response));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle question status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        questionService.toggleQuestionStatus(id);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.status.toggled", language), null));
    }

    @GetMapping("/statistics/low-success")
    @Operation(summary = "Questions with low success rate", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestionsWithLowSuccessRate(
            @Parameter(description = "Threshold 0-100") @RequestParam(defaultValue = "50.0") double threshold,
            @Parameter(description = "Limit") @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<QuestionResponse> questions = questionService.getQuestionsWithLowSuccessRate(threshold, limit, language);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/statistics/most-used")
    @Operation(summary = "Most used questions", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getMostUsedQuestions(
            @Parameter(description = "Limit") @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<QuestionResponse> questions = questionService.getMostUsedQuestions(limit, language);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/statistics/count-by-topic/{topicId}")
    @Operation(summary = "Question count by topic")
    public ResponseEntity<ApiResponse<Long>> getQuestionCountByTopic(
            @PathVariable Long topicId,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        long count = questionService.getQuestionCountByTopicId(topicId);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.count.retrieved", language), count));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Get all active questions", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getAllActiveQuestions(
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<QuestionResponse> questions = questionService.getAllActiveQuestions(language);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/by-difficulty/{difficulty}")
    @Operation(summary = "Get questions by difficulty", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getQuestionsByDifficulty(
            @PathVariable String difficulty,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Pageable pageable = PageRequest.of(page, size);
        PageResponse<QuestionResponse> response = questionService.getQuestionsByDifficulty(difficulty, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/random")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Get random questions", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getRandomQuestions(
            @Parameter(description = "Number of questions") @RequestParam(defaultValue = "10") int count,
            @Parameter(description = "Topic ID (optional)") @RequestParam(required = false) Long topicId,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<QuestionResponse> questions = questionService.getRandomQuestions(topicId, count, language);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/topic/{topicId}/count")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Count questions in topic")
    public ResponseEntity<ApiResponse<Long>> countQuestionsByTopic(@PathVariable Long topicId) {
        long count = questionService.getQuestionCountByTopicId(topicId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/statistics/by-topic")
    @Operation(summary = "Question statistics by all topics", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<TopicQuestionStatResponse>>> getQuestionStatsByAllTopics(
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicQuestionStatResponse> stats = questionService.getQuestionStatsByAllTopics(language);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ============================================================
    // NEW: Create question with image (Multipart)
    // ============================================================

    @PostMapping(value = "/with-image", consumes = {"multipart/form-data"})
    @Operation(summary = "Create question with image (Multipart)", description = "Multi-language: UZL, UZC, EN, RU. Image optional. Use multipart/form-data.")
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestionWithImage(
            @Valid @ModelAttribute QuestionRequest request,
            @Parameter(description = "Question image file (optional)")
            @RequestParam(required = false) MultipartFile imageFile,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.createQuestionWithImage(request, imageFile, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.question.created", language), response));
    }

    // ============================================================
    // NEW: Update question with image (Multipart)
    // ============================================================

    @PutMapping(value = "/{id}/with-image", consumes = {"multipart/form-data"})
    @Operation(summary = "Update question with image (Multipart)", description = "Multi-language: UZL, UZC, EN, RU. Image optional. Use multipart/form-data.")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestionWithImage(
            @PathVariable Long id,
            @Valid @ModelAttribute QuestionRequest request,
            @Parameter(description = "New question image file (optional)")
            @RequestParam(required = false) MultipartFile imageFile,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.updateQuestionWithImage(id, request, imageFile, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.updated", language), response));
    }
    // ============================================================
    // NEW: Update only question image
    // ============================================================

    @PatchMapping("/{id}/image")
    @Operation(summary = "Update question image only")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestionImage(
            @PathVariable Long id,
            @Parameter(description = "New image file") @RequestParam MultipartFile imageFile,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.updateQuestionImage(id, imageFile, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.image.updated", language), response));
    }

    // ============================================================
    // NEW: Delete question image
    // ============================================================

    @DeleteMapping("/{id}/image")
    @Operation(summary = "Delete question image")
    public ResponseEntity<ApiResponse<QuestionResponse>> deleteQuestionImage(
            @PathVariable Long id,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        QuestionResponse response = questionService.deleteQuestionImage(id, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.question.image.deleted", language), response));
    }
}