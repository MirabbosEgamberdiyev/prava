package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.exam.ExamResponse;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Guest (autentifikatsiyasiz) foydalanuvchilar uchun bepul imtihon.
 * /api/v1/public/** - SecurityConfig da allaqachon permitAll qilingan.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public", description = "Autentifikatsiyasiz umumiy endpointlar")
public class GuestExamController {

    private final QuestionRepository questionRepository;
    private final ExamResponseMapper mapper;

    private static final int GUEST_QUESTION_COUNT = 20;
    private static final int GUEST_DURATION_MINUTES = 20;
    private static final int GUEST_PASSING_SCORE = 90;

    /**
     * Guest imtihon uchun 20 ta tasodifiy savol qaytaradi.
     * Visible mode = true: to'g'ri javoblar va tushuntirishlar ham qaytariladi.
     * Autentifikatsiya TALAB QILINMAYDI.
     */
    @GetMapping("/guest-exam")
    @Operation(
            summary = "Guest imtihon savollar",
            description = "Autentifikatsiyasiz 20 ta tasodifiy savol. To'g'ri javoblar ham qaytariladi."
    )
    public ResponseEntity<ApiResponse<ExamResponse>> getGuestExam() {
        log.debug("Guest exam so'rovi — bazadan tasodifiy savollar yuklanmoqda");

        // ⚠️ AUDIT — PERFORMANCE: avval bu yerda
        // `findRandomQuestionsWithOptions(PageRequest...)` chaqirilardi.
        // U `LEFT JOIN FETCH` + `Pageable` kombinatsiyasi bo'lgani uchun
        // Hibernate LIMIT'ni SQL'ga qo'sha olmasdi va BUTUN savollar jadvalini
        // (minglab savol + variantlari) xotiraga yuklab, sahifalashni Java'da
        // bajarardi. Bu endpoint AUTENTIFIKATSIYASIZ ochiq — ya'ni har qanday
        // kishi takroriy so'rov bilan serverni xotiradan mahrum qila olardi.
        //
        // Endi ikki bosqich: (1) DB tomonda random + LIMIT bilan faqat ID'lar,
        // (2) o'sha ID'lar uchun variantlar bitta so'rovda.
        List<Long> ids = questionRepository.findRandomQuestionIds(
                PageRequest.of(0, GUEST_QUESTION_COUNT)
        );

        List<Question> available = ids.isEmpty()
                ? List.of()
                : questionRepository.findByIdsWithOptions(ids);

        if (available.isEmpty()) {
            log.warn("Guest exam: bazada faol savollar topilmadi");
            return ResponseEntity.ok(ApiResponse.success(
                    ExamResponse.builder()
                            .totalQuestions(0)
                            .durationMinutes(GUEST_DURATION_MINUTES)
                            .passingScore(GUEST_PASSING_SCORE)
                            .isVisibleMode(true)
                            .isMarathonMode(false)
                            .questions(List.of())
                            .build()
            ));
        }

        // ID'lar allaqachon DB tomonda tasodifiy tanlangan; bu yerdagi shuffle
        // faqat `IN (:ids)` natijasining tartibini aralashtirish uchun.
        List<Question> selected = new ArrayList<>(available);
        Collections.shuffle(selected);
        if (selected.size() > GUEST_QUESTION_COUNT) {
            selected = selected.subList(0, GUEST_QUESTION_COUNT);
        }

        // Visible mode = true: to'g'ri javoblar va tushuntirishlar qaytariladi
        List<QuestionResponse> questions = mapper.toQuestionResponses(selected, true);

        LocalDateTime now = LocalDateTime.now();
        ExamResponse response = ExamResponse.builder()
                .totalQuestions(questions.size())
                .durationMinutes(GUEST_DURATION_MINUTES)
                .passingScore(GUEST_PASSING_SCORE)
                .startedAt(now)
                .expiresAt(now.plusMinutes(GUEST_DURATION_MINUTES))
                .isVisibleMode(true)
                .isMarathonMode(false)
                .questions(questions)
                .build();

        log.debug("Guest exam: {} ta savol qaytarildi", questions.size());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
