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
import uz.pravaimtihon.dto.response.PublicStatsResponse;
import uz.pravaimtihon.dto.response.exam.ExamResponse;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TopicRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Guest (autentifikatsiyasiz) foydalanuvchilar uchun bepul imtihon va umumiy statistika.
 * /api/v1/public/** - SecurityConfig da allaqachon permitAll qilingan.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public", description = "Autentifikatsiyasiz umumiy endpointlar")
public class GuestExamController {

    private final QuestionRepository questionRepository;
    private final ExamPackageRepository packageRepository;
    private final TopicRepository topicRepository;
    private final ExamResponseMapper mapper;
    private final uz.pravaimtihon.repository.TicketRepository ticketRepository;
    private final uz.pravaimtihon.service.ExamGradingPolicy gradingPolicy;

    // B-12: guest qiymatlari exam-rules.guest dan (avval konstantalar edi).
    private int guestQuestionCount() {
        return Math.max(1, gradingPolicy.rules().getGuest().getQuestionCount());
    }

    private int guestDurationMinutes(int questionCount) {
        return Math.max(1, (int) Math.ceil(questionCount * gradingPolicy.rules().getGuest().getSecondsPerQuestion() / 60.0));
    }

    /** maxWrong qoidasining foiz ekvivalenti (20 savol, 3 xato → 85). */
    private int guestPassingScore(int questionCount) {
        int allowed = (int) Math.floor((double) Math.max(0, gradingPolicy.rules().getGuest().getMaxWrong())
                * questionCount / guestQuestionCount());
        return uz.pravaimtihon.service.ExamGradingPolicy.equivalentPercent(questionCount, allowed);
    }

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
        int guestCount = guestQuestionCount();

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
                PageRequest.of(0, guestCount)
        );

        List<Question> available = ids.isEmpty()
                ? List.of()
                : questionRepository.findByIdsWithOptions(ids);

        if (available.isEmpty()) {
            log.warn("Guest exam: bazada faol savollar topilmadi");
            return ResponseEntity.ok(ApiResponse.success(
                    ExamResponse.builder()
                            .totalQuestions(0)
                            .durationMinutes(guestDurationMinutes(guestCount))
                            .passingScore(guestPassingScore(guestCount))
                            .maxWrong(gradingPolicy.rules().getGuest().getMaxWrong())
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
        if (selected.size() > guestCount) {
            selected = selected.subList(0, guestCount);
        }

        // Visible mode = true: to'g'ri javoblar va tushuntirishlar qaytariladi
        List<QuestionResponse> questions = mapper.toQuestionResponses(selected, true);

        LocalDateTime now = LocalDateTime.now();
        ExamResponse response = ExamResponse.builder()
                .totalQuestions(questions.size())
                .durationMinutes(guestDurationMinutes(questions.size()))
                .passingScore(guestPassingScore(questions.size()))
                .maxWrong((int) Math.floor((double) gradingPolicy.rules().getGuest().getMaxWrong() * questions.size() / guestCount))
                .startedAt(now)
                .expiresAt(now.plusMinutes(guestDurationMinutes(questions.size())))
                .isVisibleMode(true)
                .isMarathonMode(false)
                .questions(questions)
                .build();

        log.debug("Guest exam: {} ta savol qaytarildi", questions.size());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Autentifikatsiyasiz umumiy tizim statistikasi (bosh sahifa va mehmonlar uchun)
     */
    @GetMapping("/stats")
    @Operation(
            summary = "Umumiy statistika",
            description = "Autentifikatsiyasiz ochiq umumiy statistika (savollar, biletlar va mavzular soni)."
    )
    public ResponseEntity<ApiResponse<PublicStatsResponse>> getPublicStats() {
        // B-15: faqat haqiqiy sonlar — o'chirilgan (soft-deleted) va nofaol yozuvlarsiz.
        // Avval bo'sh bazada to'qib chiqarilgan qiymatlar (1200/70/30) va soxta activeUsers=50000 qaytarilardi.
        // activeUsers endi qaytarilmaydi (web uni ko'rsatmaydi).
        PublicStatsResponse stats = PublicStatsResponse.builder()
                .totalQuestions(questionRepository.countActiveQuestions())
                .totalPackages(packageRepository.countActivePackages())
                .totalTopics(topicRepository.countByDeletedFalseAndIsActiveTrue())
                .totalTickets(ticketRepository.countActiveTickets())
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
