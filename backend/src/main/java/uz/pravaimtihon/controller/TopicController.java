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
import uz.pravaimtihon.dto.request.TopicRequest;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.TopicService;

import java.util.List;

/**
 * ✅ Mavzular (Topic) Boshqaruvi - To'liq Multi-Language + i18n
 * Qo'llab-quvvatlanadigan tillar: UZL (O'zbek Lotin), UZC (Ўзбек Кирилл), EN (English), RU (Русский)
 */
@RestController
@RequestMapping("/api/v1/admin/topics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@Tag(name = "Topic Management", description = "Mavzularni yaratish, tahrirlash, o'chirish")
public class TopicController {

    private final TopicService topicService;
    private final MessageService messageService;

    /**
     * ✅ MAVZU YARATISH - 4 tilda qo'llab-quvvatlash
     * POST /api/v1/admin/topics
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @PostMapping
    @Operation(
            summary = "Mavzu yaratish",
            description = "Yangi mavzu. Majburiy: nameUzl, code (unikal)."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Mavzu muvaffaqiyatli yaratildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Mavzu muvaffaqiyatli yaratildi",
                                      "data": {
                                        "id": 1,
                                        "code": "YHQ",
                                        "name": "Yo'l harakati qoidalari",
                                        "description": "Yo'l harakati qoidalari bo'yicha savollar",
                                        "iconUrl": "/api/v1/files/icons/yhq.png",
                                        "displayOrder": 1,
                                        "isActive": true,
                                        "questionCount": 0,
                                        "packageCount": 0
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri so'rov",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Bu kod allaqachon mavjud",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Ruxsat yo'q - faqat ADMIN/SUPER_ADMIN"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Validatsiya xatosi"
            )
    })
    public ResponseEntity<ApiResponse<TopicResponse>> createTopic(
            @Valid @RequestBody TopicRequest request,
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "uzl")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        TopicResponse response = topicService.createTopic(request, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.topic.created", language), response));
    }

    /**
     * ✅ UPDATE TOPIC - 4 Languages Support
     * PUT /api/v1/admin/topics/{id}
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @PutMapping("/{id}")
    @Operation(
            summary = "Update topic",
            description = "Update topic fields in any language. Response language depends on Accept-Language header"
    )
    public ResponseEntity<ApiResponse<TopicResponse>> updateTopic(
            @PathVariable Long id,
            @Valid @RequestBody TopicRequest request,
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        TopicResponse response = topicService.updateTopic(id, request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.topic.updated", language), response));
    }

    /**
     * ✅ DELETE TOPIC - Soft Delete
     * DELETE /api/v1/admin/topics/{id}
     */
    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete topic",
            description = "Soft delete topic. Only works if topic has no questions"
    )
    public ResponseEntity<ApiResponse<Void>> deleteTopic(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        topicService.deleteTopic(id);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.topic.deleted", language), null));
    }

    /**
     * ✅ GET TOPIC BY ID - 4 Languages Support
     * GET /api/v1/admin/topics/{id}
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping("/{id}")
    @Operation(
            summary = "Get topic by ID",
            description = "Returns topic in specified language. Falls back to UZL if translation not available"
    )
    public ResponseEntity<ApiResponse<TopicResponse>> getTopic(
            @PathVariable Long id,
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "en")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        TopicResponse response = topicService.getTopicById(id, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ GET TOPIC BY CODE - 4 Languages Support
     * GET /api/v1/admin/topics/code/{code}
     * Headers: Accept-Language: uzl|uzc|en|ru
     * Open for: SUPER_ADMIN, ADMIN, USER
     */
    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Get topic by unique code",
            description = "Find topic by code (e.g., 'traffic_rules'). Returns localized data"
    )
    public ResponseEntity<ApiResponse<TopicResponse>> getTopicByCode(
            @PathVariable String code,
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "uzc")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        TopicResponse response = topicService.getTopicByCode(code, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ GET ALL TOPICS WITH PAGINATION - 4 Languages Support
     * GET /api/v1/admin/topics?page=0&size=20&sortBy=displayOrder&direction=ASC
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @GetMapping
    @Operation(
            summary = "Get all topics (paginated)",
            description = "Returns paginated topics. Names and descriptions are localized based on Accept-Language"
    )
    public ResponseEntity<ApiResponse<PageResponse<TopicResponse>>> getAllTopics(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Sort by field", example = "displayOrder")
            @RequestParam(defaultValue = "displayOrder") String sortBy,

            @Parameter(description = "Sort direction: ASC|DESC", example = "ASC")
            @RequestParam(defaultValue = "ASC") String direction,

            @Parameter(description = "Language: uzl|uzc|en|ru", example = "ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<TopicResponse> response = topicService.getAllTopics(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ GET ACTIVE TOPICS (NO PAGINATION) - 4 Languages Support
     * GET /api/v1/admin/topics/active
     * Headers: Accept-Language: uzl|uzc|en|ru
     * Open for: SUPER_ADMIN, ADMIN, USER
     */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Get all active topics",
            description = "Returns all active topics (no pagination). Sorted by displayOrder. Cached for performance"
    )
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getAllActiveTopics(
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "en")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicResponse> topics = topicService.getAllActiveTopics(language);
        return ResponseEntity.ok(ApiResponse.success(topics));
    }

    /**
     * ✅ GET SIMPLE TOPIC LIST (FOR DROPDOWNS) - 4 Languages Support
     * GET /api/v1/admin/topics/simple
     * Headers: Accept-Language: uzl|uzc|en|ru
     * Open for: SUPER_ADMIN, ADMIN, USER
     */
    @GetMapping("/simple")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Get simple topic list",
            description = "Lightweight response for dropdowns/selects. Returns: id, code, name, iconUrl. Cached"
    )
    public ResponseEntity<ApiResponse<List<TopicSimpleResponse>>> getSimpleTopicList(
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "uzl")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicSimpleResponse> topics = topicService.getSimpleTopicList(language);
        return ResponseEntity.ok(ApiResponse.success(topics));
    }

    /**
     * ✅ GET TOPICS WITH QUESTIONS - 4 Languages Support
     * GET /api/v1/admin/topics/with-questions
     * Headers: Accept-Language: uzl|uzc|en|ru
     * Open for: SUPER_ADMIN, ADMIN, USER
     */
    @GetMapping("/with-questions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Get topics that have questions",
            description = "Returns only topics where questionCount > 0. Useful for exam creation"
    )
    public ResponseEntity<ApiResponse<List<TopicSimpleResponse>>> getTopicsWithQuestions(
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "uzc")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicSimpleResponse> topics = topicService.getTopicsWithQuestions(language);
        return ResponseEntity.ok(ApiResponse.success(topics));
    }

    /**
     * ✅ SEARCH TOPICS - 4 Languages Support
     * GET /api/v1/admin/topics/search?query=traffic&page=0&size=20
     * Headers: Accept-Language: uzl|uzc|en|ru
     * Searches in: nameUzl, nameUzc, nameEn, nameRu, code
     */
    @GetMapping("/search")
    @Operation(
            summary = "Search topics by name or code",
            description = "Searches in all language fields (nameUzl, nameUzc, nameEn, nameRu, code). Case-insensitive"
    )
    public ResponseEntity<ApiResponse<PageResponse<TopicResponse>>> searchTopics(
            @Parameter(description = "Search query", example = "traffic")
            @RequestParam String query,

            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Language: uzl|uzc|en|ru", example = "en")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Pageable pageable = PageRequest.of(page, size);

        PageResponse<TopicResponse> response = topicService.searchTopics(query, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * ✅ TOGGLE TOPIC STATUS
     * PATCH /api/v1/admin/topics/{id}/toggle
     * Switches isActive: true ↔ false
     */
    @PatchMapping("/{id}/toggle")
    @Operation(
            summary = "Toggle topic active status",
            description = "Switches isActive between true and false. Clears cache"
    )
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        topicService.toggleTopicStatus(id);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.topic.status.toggled", language), null));
    }

    /**
     * ✅ CREATE BULK TOPICS - Create Multiple Topics at Once
     * POST /api/v1/admin/topics/bulk
     * Headers: Accept-Language: uzl|uzc|en|ru
     */
    @PostMapping("/bulk")
    @Operation(
            summary = "Create multiple topics at once",
            description = "Bulk create topics. Validates all topics before creating. Returns created topics in specified language"
    )
    public ResponseEntity<ApiResponse<List<TopicResponse>>> createBulkTopics(
            @Valid @RequestBody List<TopicRequest> requests,
            @Parameter(description = "Language: uzl|uzc|en|ru", example = "uzl")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        List<TopicResponse> responses = topicService.createBulkTopics(requests, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.topic.bulk.created", new Object[]{responses.size()}, language), responses));
    }
}