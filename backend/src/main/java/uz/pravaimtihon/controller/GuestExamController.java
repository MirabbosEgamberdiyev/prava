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

        // OPTIONS bilan birga savollarni olish (LazyInitializationException oldini olish)
        // count * 3 = 60 ta savoldan shuffle qilib 20 ta tanlaymiz
        List<Question> available = questionRepository.findRandomQuestionsWithOptions(
                PageRequest.of(0, GUEST_QUESTION_COUNT * 3)
        );

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

        // Java da shuffle — PostgreSQL RANDOM() + DISTINCT + LIMIT muammosidan qochish
        Collections.shuffle(available);

        List<Question> selected = available.size() > GUEST_QUESTION_COUNT
                ? available.subList(0, GUEST_QUESTION_COUNT)
                : available;

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
