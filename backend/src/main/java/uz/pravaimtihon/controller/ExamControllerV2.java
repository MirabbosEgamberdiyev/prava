package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.ExamStartResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.dto.response.exam.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.service.ExamServiceV2;
import uz.pravaimtihon.service.MessageService;

/**
 * Imtihon Controller V2 - Stateless, Multi-Tab Safe, Production Ready
 * Asosiy xususiyatlar:
 * - Session locking YO'Q - bir nechta tab ishlashi mumkin
 * - Barcha tillar bir vaqtda qaytariladi (UZL, UZC, EN, RU)
 * - Visible va Secure rejimlar
 * - Cloud-ready va horizontally scalable
 */
@RestController
@RequestMapping("/api/v2/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
@Tag(name = "Exam Management V2", description = "Imtihon boshlash, javob topshirish - multi-tab safe")
public class ExamControllerV2 {

    private final ExamServiceV2 examService;
    private final uz.pravaimtihon.service.impl.ExamService examServiceV1;
    private final MessageService messageService;

    // ============================================
    // 1. IMTIHON BOSHLASH - VISIBLE MODE
    // ============================================

    /**
     * Bu endpoint imtihonni practice rejimida boshlaydi.
     * Qachon ishlatiladi: Frontend mashq qilish uchun - to'g'ri javoblarni ko'rsatish kerak bo'lganda.
     * Qanday natija qaytaradi: Savollar ro'yxati (4 tilda) + to'g'ri javob indekslari + tushuntirishlar.
     */
    @PostMapping("/start-visible")
    @Operation(
            summary = "Imtihon boshlash (Visible)",
            description = "Practice rejimi. To'g'ri javoblar va tushuntirishlar qaytariladi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Imtihon muvaffaqiyatli boshlandi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Paket topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<ExamResponse>> startExamVisible(
            @Valid @RequestBody ExamStartRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResponse response = examService.startExamVisible(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.started", language),
                response
        ));
    }

    // ============================================
    // 2. IMTIHON BOSHLASH - SECURE MODE
    // ============================================

    /**
     * Bu endpoint imtihonni haqiqiy rejimda boshlaydi.
     * Qachon ishlatiladi: Haqiqiy imtihon o'tkazishda - to'g'ri javoblarni yashirish kerak bo'lganda.
     * Qanday natija qaytaradi: Savollar ro'yxati (4 tilda) - to'g'ri javoblar YASHIRIN.
     */
    @PostMapping("/start-secure")
    @Operation(
            summary = "Imtihon boshlash (Secure)",
            description = "Haqiqiy rejim. To'g'ri javoblar va tushuntirishlar YASHIRIN."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Imtihon muvaffaqiyatli boshlandi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Paket topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<ExamResponse>> startExamSecure(
            @Valid @RequestBody ExamStartRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResponse response = examService.startExamSecure(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.started", language),
                response
        ));
    }

    // ============================================
    // 3. MARAFON BOSHLASH - VISIBLE MODE
    // ============================================

    /**
     * Bu endpoint marafonni practice rejimida boshlaydi.
     * Qachon ishlatiladi: Foydalanuvchi faqat savollar sonini tanlaydi, paket kerak emas.
     * Qanday natija qaytaradi: N ta tasodifiy savol (4 tilda) + to'g'ri javoblar + tushuntirishlar.
     */
    @PostMapping("/marathon/start-visible")
    @Operation(
            summary = "Marafon boshlash (Visible)",
            description = "Tasodifiy savollar. To'g'ri javoblar qaytariladi. Paket talab qilinmaydi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Marafon muvaffaqiyatli boshlandi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Yetarli savollar mavjud emas"
            )
    })
    public ResponseEntity<ApiResponse<ExamResponse>> startMarathonVisible(
            @Valid @RequestBody MarathonStartRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResponse response = examService.startMarathonVisible(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.marathon.started", language),
                response
        ));
    }

    // ============================================
    // 4. MARAFON BOSHLASH - SECURE MODE
    // ============================================

    /**
     * Bu endpoint marafonni haqiqiy rejimda boshlaydi.
     * Qachon ishlatiladi: Haqiqiy marafon o'tkazishda - to'g'ri javoblarni yashirish kerak.
     * Qanday natija qaytaradi: N ta tasodifiy savol (4 tilda) - to'g'ri javoblar YASHIRIN.
     */
    @PostMapping("/marathon/start-secure")
    @Operation(
            summary = "Marafon boshlash (Secure)",
            description = "Tasodifiy savollar. To'g'ri javoblar YASHIRIN. Paket talab qilinmaydi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Marafon muvaffaqiyatli boshlandi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Yetarli savollar mavjud emas"
            )
    })
    public ResponseEntity<ApiResponse<ExamResponse>> startMarathonSecure(
            @Valid @RequestBody MarathonStartRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResponse response = examService.startMarathonSecure(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.marathon.started", language),
                response
        ));
    }

    // ============================================
    // 5. JAVOBLARNI TOPSHIRISH
    // ============================================

    /**
     * Bu endpoint imtihon javoblarini topshiradi va natijani qaytaradi.
     * Qachon ishlatiladi: Normal va Marathon imtihonlar uchun javoblarni topshirishda.
     * Qanday natija qaytaradi: To'liq statistika - to'g'ri/noto'g'ri/javobsiz sonlari, foiz, o'tdi/yiqildi.
     * sessionId har doim kerak - imtihon boshlanishida qaytarilgan sessionId ni yuboring.
     */
    @PostMapping("/submit")
    @Operation(
            summary = "Javoblarni topshirish",
            description = "Imtihon javoblarini topshirish va natijani olish. sessionId majburiy."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Javoblar muvaffaqiyatli topshirildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Sessiya allaqachon tugatilgan yoki bekor qilingan"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Sessiya topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<ExamResultResponse>> submitExam(
            @Valid @RequestBody ExamSubmitRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResultResponse response = examService.submitExam(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.submitted", language),
                response
        ));
    }

    // ============================================
    // 6. JAVOBNI TEKSHIRISH (INSTANT)
    // ============================================

    /**
     * Bu endpoint bitta javobni tezkor tekshiradi.
     * Qachon ishlatiladi: Frontend uchun - bir marta bosishda to'g'ri/noto'g'ri ko'rsatish.
     * Qanday natija qaytaradi: isCorrect + correctOptionIndex + explanation (4 tilda).
     */
    @PostMapping("/check-answer")
    @Operation(
            summary = "Javobni tekshirish",
            description = "Bitta javobni tezkor tekshirish. Instant feedback uchun."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Javob tekshirildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Savol topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<CheckAnswerResponse>> checkAnswer(
            @Valid @RequestBody CheckAnswerRequest request) {

        CheckAnswerResponse response = examService.checkAnswer(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // 7. NATIJANI OLISH
    // ============================================

    /**
     * Bu endpoint tugatilgan imtihon natijasini qaytaradi.
     * Qachon ishlatiladi: Imtihon tugatilgandan keyin to'liq natijani ko'rish uchun.
     * Qanday natija qaytaradi: To'liq statistika + barcha javoblar tafsiloti (4 tilda).
     */
    @GetMapping("/{sessionId}/result")
    @Operation(
            summary = "Imtihon natijasi",
            description = "Tugatilgan imtihon natijasi va javoblar tafsiloti."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Natija muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Imtihon hali tugatilmagan"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Sessiya topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<ExamResultResponse>> getExamResult(
            @PathVariable Long sessionId) {

        ExamResultResponse response = examService.getExamResult(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // 8. STATISTIKANI OLISH
    // ============================================

    /**
     * Bu endpoint tugatilgan imtihon statistikasini qaytaradi.
     * Qachon ishlatiladi: Batafsil analitika ko'rish uchun.
     * Qanday natija qaytaradi: Asosiy statistika + vaqt statistikasi + foizlar.
     */
    @GetMapping("/{sessionId}/statistics")
    @Operation(
            summary = "Imtihon statistikasi",
            description = "Batafsil statistika: vaqt, foizlar, to'g'ri/noto'g'ri javoblar."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistika muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Imtihon hali tugatilmagan"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Sessiya topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<ExamStatisticsResponse>> getExamStatistics(
            @PathVariable Long sessionId) {

        ExamStatisticsResponse response = examService.getExamStatistics(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // 9. TARIXNI OLISH
    // ============================================

    /**
     * Bu endpoint foydalanuvchi imtihon tarixini qaytaradi.
     * Qachon ishlatiladi: O'tgan imtihonlar ro'yxatini ko'rish uchun.
     * Qanday natija qaytaradi: Sahifalangan imtihonlar ro'yxati.
     */
    @GetMapping("/history")
    @Operation(
            summary = "Imtihon tarixi",
            description = "O'tgan imtihonlar ro'yxati. Sahifalash va saralash mavjud."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tarix muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            )
    })
    public ResponseEntity<ApiResponse<PageResponse<ExamHistoryResponse>>> getExamHistory(
            @Parameter(description = "Sahifa raqami (0 dan boshlanadi)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Sahifa hajmi", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Saralash maydoni", example = "startedAt")
            @RequestParam(defaultValue = "startedAt") String sortBy,

            @Parameter(description = "Saralash yo'nalishi: ASC|DESC", example = "DESC")
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<ExamHistoryResponse> historyPage = examService.getExamHistory(pageable);

        PageResponse<ExamHistoryResponse> response = PageResponse.<ExamHistoryResponse>builder()
                .content(historyPage.getContent())
                .page(historyPage.getNumber())
                .size(historyPage.getSize())
                .totalElements(historyPage.getTotalElements())
                .totalPages(historyPage.getTotalPages())
                .first(historyPage.isFirst())
                .last(historyPage.isLast())
                .empty(historyPage.isEmpty())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // 10. STATUS BO'YICHA TARIX
    // ============================================

    /**
     * Bu endpoint status bo'yicha filtrlangan tarixni qaytaradi.
     * Qachon ishlatiladi: Faqat tugatilgan yoki bekor qilingan imtihonlarni ko'rish uchun.
     * Qanday natija qaytaradi: Filtrlangan sahifalangan ro'yxat.
     */
    @GetMapping("/history/status/{status}")
    @Operation(
            summary = "Status bo'yicha tarix",
            description = "Filtrlangan tarix: COMPLETED, IN_PROGRESS, ABANDONED, EXPIRED."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tarix muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            )
    })
    public ResponseEntity<ApiResponse<PageResponse<ExamHistoryResponse>>> getExamHistoryByStatus(
            @PathVariable ExamStatus status,

            @Parameter(description = "Sahifa raqami", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Sahifa hajmi", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Saralash maydoni", example = "startedAt")
            @RequestParam(defaultValue = "startedAt") String sortBy,

            @Parameter(description = "Saralash yo'nalishi", example = "DESC")
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<ExamHistoryResponse> historyPage = examService.getExamHistoryByStatus(status, pageable);

        PageResponse<ExamHistoryResponse> response = PageResponse.<ExamHistoryResponse>builder()
                .content(historyPage.getContent())
                .page(historyPage.getNumber())
                .size(historyPage.getSize())
                .totalElements(historyPage.getTotalElements())
                .totalPages(historyPage.getTotalPages())
                .first(historyPage.isFirst())
                .last(historyPage.isLast())
                .empty(historyPage.isEmpty())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // 11. IMTIHONNI BEKOR QILISH
    // ============================================

    /**
     * Bu endpoint davom etayotgan imtihonni bekor qiladi.
     * Qachon ishlatiladi: Foydalanuvchi imtihonni tark etmoqchi bo'lganda.
     * Qanday natija qaytaradi: Muvaffaqiyat xabari.
     */
    @DeleteMapping("/{sessionId}/abandon")
    @Operation(
            summary = "Imtihonni bekor qilish",
            description = "Davom etayotgan imtihonni bekor qilish. ABANDONED statusiga o'tadi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Imtihon muvaffaqiyatli bekor qilindi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Imtihon allaqachon tugatilgan"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Sessiya topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<Void>> abandonExam(
            @PathVariable Long sessionId,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        examService.abandonExam(sessionId);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.abandoned", language),
                null
        ));
    }

    // ============================================
    // 12.5. AUTO-SAVE VA RESUME
    // ============================================

    /**
     * Auto-save javoblar — submit qilmasdan saqlash.
     */
    @PutMapping("/{sessionId}/autosave")
    @Operation(summary = "Javoblarni avto-saqlash", description = "Javoblarni submit qilmasdan serverga saqlash.")
    public ResponseEntity<ApiResponse<Void>> autoSaveAnswers(
            @PathVariable Long sessionId,
            @Valid @RequestBody AutoSaveRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        examServiceV1.autoSaveAnswers(sessionId, request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.exam.autosaved", language), null));
    }

    /**
     * Get active exam session for resume.
     */
    @GetMapping("/active")
    @Operation(summary = "Faol sessiyani olish", description = "Foydalanuvchining faol imtihon sessiyasini qaytaradi (agar bor bo'lsa).")
    public ResponseEntity<ApiResponse<ExamStartResponse>> getActiveExam(
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        ExamStartResponse response = examServiceV1.getActiveExamForResume(language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ============================================
    // 12. PAKET STATISTIKASI
    // ============================================

    /**
     * Bu endpoint paket bo'yicha foydalanuvchi statistikasini qaytaradi.
     * Qachon ishlatiladi: Foydalanuvchi o'z progressini ko'rish uchun.
     * Qanday natija qaytaradi: Paketdagi testlar soni, tugatilgan testlar, to'g'ri/noto'g'ri javoblar.
     */
    @GetMapping("/packages/{packageId}/statistics")
    @Operation(
            summary = "Paket statistikasi",
            description = "Foydalanuvchi uchun paket bo'yicha batafsil statistika."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Statistika muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Paket topilmadi"
            )
    })
    public ResponseEntity<ApiResponse<PackageStatisticsResponse>> getPackageStatistics(
            @PathVariable Long packageId) {

        PackageStatisticsResponse response = examService.getPackageStatistics(packageId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
