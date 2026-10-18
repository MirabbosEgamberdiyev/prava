package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.mapper.TopicMapper;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.ContentManifestResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.dto.response.TopicResponse;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TicketRepository;
import uz.pravaimtihon.repository.TopicRepository;
import uz.pravaimtihon.service.OfflineBundleService;
import uz.pravaimtihon.util.ETags;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Markaziy Ma'lumotlar Manbasi (Single Source of Truth) Controller V2.
 * Web, Desktop va Mobile platformalar uchun yagona kontent shlyuzi.
 *
 * Base: /api/v2
 */
@Slf4j
@RestController
@RequestMapping("/api/v2")
@RequiredArgsConstructor
@Tag(name = "Central Content V2", description = "Markaziy ma'lumotlar manbasi: manifest, mavzular va savollar")
public class ContentControllerV2 {

    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final TicketRepository ticketRepository;
    private final OfflineBundleService offlineBundleService;
    private final TopicMapper topicMapper;
    private final ExamResponseMapper examResponseMapper;
    private final uz.pravaimtihon.service.UserThrottlerService userThrottlerService;

    /**
     * GET /api/v2/content/manifest
     * Kontent manifesti: versiya, yangilanish vaqti, umumiy sonlar va tekshirish ETag'i.
     * Ochiq endpoint (ETag orqali keshlanadi, 304 qaytaradi).
     */
    @GetMapping("/content/manifest")
    @Operation(summary = "Kontent manifesti", description = "Joriy kontent versiyasi, sonlar va ETag verifikatsiyasi")
    public ResponseEntity<ApiResponse<ContentManifestResponse>> getManifest(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {

        String version = offlineBundleService.currentVersion();
        String etag = "\"" + version + "\"";
        CacheControl cc = CacheControl.maxAge(60, TimeUnit.SECONDS).cachePrivate();

        if (ETags.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(etag)
                    .cacheControl(cc)
                    .build();
        }

        long totalQuestions = questionRepository.countByDeletedFalseAndIsActiveTrue();
        long totalTickets = ticketRepository.countActiveTickets();
        long totalTopics = topicRepository.countByDeletedFalseAndIsActiveTrue();
        long totalTicketQuestions = ticketRepository.countTicketQuestions();

        ContentManifestResponse manifest = ContentManifestResponse.builder()
                .version(version)
                .schemaVersion(2)
                .totalQuestions(totalQuestions)
                .totalTickets(totalTickets)
                .totalTopics(totalTopics)
                .totalTicketQuestions(totalTicketQuestions)
                .lastUpdatedAt(Instant.now())
                .checksum(version)
                .build();

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(cc)
                .body(ApiResponse.success("Manifest muvaffaqiyatli olindi", manifest));
    }

    /**
     * GET /api/v2/topics
     * Faol mavzular ro'yxati (displayOrder ASC, id ASC bo'yicha saralangan).
     */
    @GetMapping("/topics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Mavzular ro'yxati", description = "Barcha faol mavzular tartiblangan holda")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopics(
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") String languageHeader) {

        AcceptLanguage language = AcceptLanguage.fromCode(languageHeader);
        List<Topic> topics = topicRepository.findAllActiveOrderByDisplayOrder();
        List<TopicResponse> response = topicMapper.toResponseList(topics, language);

        return ResponseEntity.ok(ApiResponse.success("Mavzular muvaffaqiyatli olindi", response));
    }

    /**
     * GET /api/v2/questions
     * Savollar ro'yxati (pagination, topic filter, matn qidiruv).
     */
    @GetMapping("/questions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Savollar ro'yxati", description = "Mavzu bo'yicha filter va qidiruv bilan savollar ro'yxati")
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getQuestions(
            @RequestParam(required = false) Long topicId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean visibleMode) {

        userThrottlerService.recordAndCheck(uz.pravaimtihon.security.SecurityUtils.getCurrentUserId(), 20);

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), Sort.by(Sort.Direction.ASC, "id"));
        Page<Question> questionPage;

        if (topicId != null && search != null && !search.isBlank()) {
            questionPage = questionRepository.searchQuestionsByTopicId(topicId, search.trim(), pageable);
        } else if (topicId != null) {
            questionPage = questionRepository.findByTopicIdAndDeletedFalseAndIsActiveTrue(topicId, pageable);
        } else if (search != null && !search.isBlank()) {
            questionPage = questionRepository.searchQuestions(search.trim(), pageable);
        } else {
            questionPage = questionRepository.findByDeletedFalseAndIsActiveTrue(pageable);
        }

        List<QuestionResponse> content = examResponseMapper.toQuestionResponses(questionPage.getContent(), visibleMode);

        PageResponse<QuestionResponse> response = PageResponse.<QuestionResponse>builder()
                .content(content)
                .page(questionPage.getNumber())
                .size(questionPage.getSize())
                .totalElements(questionPage.getTotalElements())
                .totalPages(questionPage.getTotalPages())
                .first(questionPage.isFirst())
                .last(questionPage.isLast())
                .empty(questionPage.isEmpty())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v2/questions/{id}
     * Bitta savol tafsilotlari.
     */
    @GetMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Savol tafsiloti", description = "ID bo'yicha savol ma'lumotlari")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestion(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean visibleMode) {

        userThrottlerService.recordAndCheck(uz.pravaimtihon.security.SecurityUtils.getCurrentUserId(), 20);

        Question question = questionRepository.findByIdWithOptions(id)
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        QuestionResponse response = examResponseMapper.toQuestionResponse(question, 1, visibleMode);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
