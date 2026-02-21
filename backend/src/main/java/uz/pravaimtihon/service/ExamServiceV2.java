package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.config.ExamProperties;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.request.*;
import uz.pravaimtihon.dto.response.exam.*;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.*;
import uz.pravaimtihon.security.SecurityUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Imtihon Service V2 - Stateless, Multi-Tab Safe, Production Ready.
 *
 * Asosiy xususiyatlar:
 * - Session locking YO'Q - bir nechta tab ishlashi mumkin
 * - Barcha tillar bir vaqtda qaytariladi (UZL, UZC, EN, RU)
 * - Cloud-ready va horizontally scalable
 * - Concurrent-safe operatsiyalar
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExamServiceV2 {

    private final ExamSessionRepository sessionRepository;
    private final ExamAnswerRepository answerRepository;
    private final ExamPackageRepository packageRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final UserRepository userRepository;
    private final UserStatisticsRepository statisticsRepository;
    private final TopicRepository topicRepository;
    private final ExamResponseMapper mapper;
    private final ExamProperties examProperties;

    // Default passing score for marathon mode
    private static final int DEFAULT_PASSING_SCORE = 70;

    // ============================================
    // IMTIHON BOSHLASH - VISIBLE MODE
    // ============================================

    /**
     * Imtihon boshlash - to'g'ri javoblar ko'rsatiladi.
     * Frontend practice mode uchun.
     * Session locking YO'Q - bir nechta tab ishlashi mumkin.
     *
     * @param request Imtihon boshlash so'rovi
     * @return Savollar ro'yxati (4 tilda) + to'g'ri javoblar
     */
    @Transactional
    public ExamResponse startExamVisible(ExamStartRequest request) {
        return startExamInternal(request, true);
    }

    // ============================================
    // IMTIHON BOSHLASH - SECURE MODE
    // ============================================

    /**
     * Imtihon boshlash - to'g'ri javoblar YASHIRIN.
     * Haqiqiy imtihon uchun (anti-cheat).
     * Session locking YO'Q - bir nechta tab ishlashi mumkin.
     *
     * @param request Imtihon boshlash so'rovi
     * @return Savollar ro'yxati (4 tilda) - to'g'ri javoblarsiz
     */
    @Transactional
    public ExamResponse startExamSecure(ExamStartRequest request) {
        return startExamInternal(request, false);
    }

    /**
     * Ichki metod - imtihon boshlash
     */
    private ExamResponse startExamInternal(ExamStartRequest request, boolean visibleMode) {
        Long userId = getCurrentUserIdRequired();

        log.info("Imtihon boshlanmoqda: user={}, package={}, visible={}",
                userId, request.getPackageId(), visibleMode);

        // Foydalanuvchini olish
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Paketni savollar bilan olish
        ExamPackage examPackage = packageRepository.findByIdWithQuestionsAndOptions(request.getPackageId());

        if (examPackage == null || examPackage.getDeleted() || !examPackage.getIsActive()) {
            throw new ResourceNotFoundException("error.package.not.found");
        }

        if (!examPackage.hasEnoughQuestions()) {
            throw new BusinessException("error.package.insufficient.questions");
        }

        // Savollarni tanlash va aralashtirish
        List<Question> selectedQuestions = selectAndShuffleQuestions(
                new ArrayList<>(examPackage.getQuestions()),
                examPackage.getQuestionCount()
        );

        // Variantlarni yuklash
        loadOptionsForQuestions(selectedQuestions);

        // Sessiya yaratish - har doim saqlanadi
        ExamSession session = createSession(user, examPackage, selectedQuestions);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(examPackage.getDurationMinutes());

        log.info("Imtihon boshlandi: sessionId={}, questions={}, duration={}",
                session.getId(), selectedQuestions.size(), examPackage.getDurationMinutes());

        return ExamResponse.builder()
                .sessionId(session.getId())
                .packageId(examPackage.getId())
                .packageName(mapper.toPackageName(examPackage))
                .topicId(examPackage.getTopicId())
                .topicName(examPackage.getTopic() != null ? mapper.toTopicName(examPackage.getTopic()) : null)
                .totalQuestions(selectedQuestions.size())
                .durationMinutes(examPackage.getDurationMinutes())
                .passingScore(examPackage.getPassingScore())
                .startedAt(now)
                .expiresAt(expiresAt)
                .isMarathonMode(false)
                .isVisibleMode(visibleMode)
                .questions(mapper.toQuestionResponses(selectedQuestions, visibleMode))
                .build();
    }

    // ============================================
    // MARAFON BOSHLASH - VISIBLE MODE
    // ============================================

    /**
     * Marafon boshlash - to'g'ri javoblar ko'rsatiladi.
     * Foydalanuvchi faqat savollar sonini ko'rsatadi.
     *
     * @param request Marafon so'rovi
     * @return Savollar ro'yxati (4 tilda) + to'g'ri javoblar
     */
    @Transactional
    public ExamResponse startMarathonVisible(MarathonStartRequest request) {
        return startMarathonInternal(request, true);
    }

    // ============================================
    // MARAFON BOSHLASH - SECURE MODE
    // ============================================

    /**
     * Marafon boshlash - to'g'ri javoblar YASHIRIN.
     *
     * @param request Marafon so'rovi
     * @return Savollar ro'yxati (4 tilda) - to'g'ri javoblarsiz
     */
    @Transactional
    public ExamResponse startMarathonSecure(MarathonStartRequest request) {
        return startMarathonInternal(request, false);
    }

    /**
     * Ichki metod - marafon boshlash
     */
    private ExamResponse startMarathonInternal(MarathonStartRequest request, boolean visibleMode) {
        Long userId = getCurrentUserIdRequired();

        log.info("Marafon boshlanmoqda: user={}, questions={}, topic={}, visible={}",
                userId, request.getQuestionCount(), request.getTopicId(), visibleMode);

        // Foydalanuvchini olish
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Mavzu bo'yicha savollarni olish (OPTIONS bilan birga - JOIN FETCH)
        List<Question> availableQuestions;
        Topic topic = null;

        if (request.getTopicId() != null) {
            topic = topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new ResourceNotFoundException("error.topic.not.found"));

            // ✅ FIXED: OPTIONS bilan birga yuklash - LazyInitializationException oldini olish
            availableQuestions = questionRepository.findRandomByTopicWithOptions(
                    topic,
                    PageRequest.of(0, request.getQuestionCount() * 2)
            );
        } else {
            // ✅ FIXED: OPTIONS bilan birga yuklash - LazyInitializationException oldini olish
            availableQuestions = questionRepository.findRandomQuestionsWithOptions(
                    PageRequest.of(0, request.getQuestionCount() * 2)
            );
        }

        if (availableQuestions.size() < request.getQuestionCount()) {
            throw new BusinessException("error.marathon.insufficient.questions");
        }

        // Savollarni tanlash va aralashtirish
        List<Question> selectedQuestions = selectAndShuffleQuestions(
                availableQuestions,
                request.getQuestionCount()
        );

        // ✅ OPTIONS allaqachon yuklangan - loadOptionsForQuestions kerak emas

        // Davomiylik va o'tish balini hisoblash
        int durationMinutes = request.getDurationMinutes() != null
                ? request.getDurationMinutes()
                : Math.max(examProperties.getMarathonMinDurationMinutes(), request.getQuestionCount());

        int passingScore = request.getPassingScore() != null
                ? request.getPassingScore()
                : DEFAULT_PASSING_SCORE;

        // Sessiya yaratish - har doim saqlanadi
        ExamSession session = createMarathonSession(user, selectedQuestions, durationMinutes, passingScore);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(durationMinutes);

        log.info("Marafon boshlandi: sessionId={}, questions={}, duration={}, topic={}",
                session.getId(), selectedQuestions.size(), durationMinutes,
                topic != null ? topic.getCode() : "all");

        return ExamResponse.builder()
                .sessionId(session.getId())
                .packageId(null)
                .packageName(null)
                .topicId(topic != null ? topic.getId() : null)
                .topicName(topic != null ? mapper.toTopicName(topic) : null)
                .totalQuestions(selectedQuestions.size())
                .durationMinutes(durationMinutes)
                .passingScore(passingScore)
                .startedAt(now)
                .expiresAt(expiresAt)
                .isMarathonMode(true)
                .isVisibleMode(visibleMode)
                .questions(mapper.toQuestionResponses(selectedQuestions, visibleMode))
                .build();
    }

    // ============================================
    // JAVOBLARNI TOPSHIRISH
    // ============================================

    /**
     * Imtihon javoblarini topshirish.
     * Normal va Marathon rejimlar uchun ishlaydi.
     * Sessiya har doim kerak - statistika va tarix saqlanadi.
     *
     * @param request Javoblar ro'yxati
     * @return Natija - to'liq statistika
     */
    @Transactional
    public ExamResultResponse submitExam(ExamSubmitRequest request) {
        Long userId = getCurrentUserIdRequired();

        log.info("Javoblar topshirilmoqda: user={}, sessionId={}, answers={}",
                userId, request.getSessionId(), request.getAnswers().size());

        ExamSession session = sessionRepository.findByIdAndUserId(request.getSessionId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.exam.session.not.found"));

        if (session.getStatus() == ExamStatus.COMPLETED) {
            throw new BusinessException("error.exam.session.already.completed");
        }

        if (session.getStatus() == ExamStatus.ABANDONED) {
            throw new BusinessException("error.exam.session.abandoned");
        }

        // Muddati o'tganligini tekshirish
        boolean isExpired = session.isExpired();
        if (isExpired) {
            session.expire();
        }

        // Javoblarni map qilish
        Map<Long, AnswerSubmitRequest> answerMap = request.getAnswers().stream()
                .collect(Collectors.toMap(
                        AnswerSubmitRequest::getQuestionId,
                        a -> a,
                        (a1, a2) -> a2
                ));

        // Imtihon javoblarini olish va qayta ishlash
        List<ExamAnswer> examAnswers = answerRepository.findByExamSessionIdOrderByQuestionOrder(session.getId());

        for (ExamAnswer examAnswer : examAnswers) {
            Question question = examAnswer.getQuestion();
            if (question == null) continue;

            AnswerSubmitRequest userAnswer = answerMap.get(question.getId());

            if (userAnswer != null && userAnswer.getSelectedOptionIndex() != null) {
                examAnswer.submitAnswer(
                        userAnswer.getSelectedOptionIndex(),
                        userAnswer.getTimeSpentSeconds()
                );
                question.recordAnswer(examAnswer.getIsCorrect());
            }
        }

        answerRepository.saveAll(examAnswers);

        if (!isExpired) {
            session.finish();
        }
        session = sessionRepository.save(session);

        // Statistikani yangilash
        updateUserStatisticsSafe(session);

        log.info("Imtihon topshirildi: sessionId={}, score={}/{}",
                session.getId(), session.getCorrectCount(), session.getTotalQuestions());

        return buildResultResponse(session, examAnswers);
    }

    // ============================================
    // JAVOBNI TEKSHIRISH (INSTANT)
    // ============================================

    /**
     * Javobni tezkor tekshirish.
     * Frontend uchun - bir marta bosishda to'g'ri/noto'g'ri ko'rsatish.
     *
     * @param request Savol ID va tanlangan variant
     * @return To'g'ri/noto'g'ri + tushuntirish
     */
    @Transactional(readOnly = true)
    public CheckAnswerResponse checkAnswer(CheckAnswerRequest request) {
        getCurrentUserIdRequired(); // Auth tekshirish

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        log.debug("Javob tekshirilmoqda: questionId={}, selected={}",
                request.getQuestionId(), request.getSelectedOptionIndex());

        return mapper.toCheckAnswerResponse(question, request.getSelectedOptionIndex());
    }

    // ============================================
    // NATIJANI OLISH
    // ============================================

    /**
     * Tugatilgan imtihon natijasini olish.
     *
     * @param sessionId Sessiya ID
     * @return To'liq natija - statistika va javoblar
     */
    @Transactional(readOnly = true)
    public ExamResultResponse getExamResult(Long sessionId) {
        Long userId = getCurrentUserIdRequired();

        ExamSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.exam.session.not.found"));

        if (session.getStatus() != ExamStatus.COMPLETED && session.getStatus() != ExamStatus.EXPIRED) {
            throw new BusinessException("error.exam.session.not.completed");
        }

        List<ExamAnswer> answers = answerRepository.findByExamSessionIdOrderByQuestionOrder(sessionId);

        return buildResultResponse(session, answers);
    }

    // ============================================
    // STATISTIKANI OLISH
    // ============================================

    /**
     * Tugatilgan imtihon statistikasini olish.
     *
     * @param sessionId Sessiya ID
     * @return Batafsil statistika
     */
    @Transactional(readOnly = true)
    public ExamStatisticsResponse getExamStatistics(Long sessionId) {
        Long userId = getCurrentUserIdRequired();

        ExamSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.exam.session.not.found"));

        if (session.getStatus() != ExamStatus.COMPLETED && session.getStatus() != ExamStatus.EXPIRED) {
            throw new BusinessException("error.exam.session.not.completed");
        }

        List<ExamAnswer> answers = answerRepository.findByExamSessionIdOrderByQuestionOrder(sessionId);

        return buildStatisticsResponse(session, answers);
    }

    // ============================================
    // TARIXNI OLISH
    // ============================================

    /**
     * Foydalanuvchi imtihon tarixini olish.
     *
     * @param pageable Sahifalash
     * @return Imtihonlar ro'yxati
     */
    @Transactional(readOnly = true)
    public Page<ExamHistoryResponse> getExamHistory(Pageable pageable) {
        Long userId = getCurrentUserIdRequired();
        Page<ExamSession> sessions = sessionRepository.findByUserIdOrderByStartedAtDesc(userId, pageable);
        return sessions.map(mapper::toHistoryResponse);
    }

    /**
     * Status bo'yicha imtihon tarixini olish.
     *
     * @param status Imtihon statusi
     * @param pageable Sahifalash
     * @return Imtihonlar ro'yxati
     */
    @Transactional(readOnly = true)
    public Page<ExamHistoryResponse> getExamHistoryByStatus(ExamStatus status, Pageable pageable) {
        Long userId = getCurrentUserIdRequired();
        Page<ExamSession> sessions = sessionRepository.findByUserIdAndStatusOrderByStartedAtDesc(userId, status, pageable);
        return sessions.map(mapper::toHistoryResponse);
    }

    // ============================================
    // IMTIHONNI BEKOR QILISH
    // ============================================

    /**
     * Davom etayotgan imtihonni bekor qilish.
     *
     * @param sessionId Sessiya ID
     */
    @Transactional
    public void abandonExam(Long sessionId) {
        Long userId = getCurrentUserIdRequired();

        log.info("Imtihon bekor qilinmoqda: sessionId={}", sessionId);

        ExamSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.exam.session.not.found"));

        if (session.getStatus() == ExamStatus.COMPLETED) {
            throw new BusinessException("error.exam.session.already.completed");
        }

        session.abandon();
        sessionRepository.save(session);

        log.info("Imtihon bekor qilindi: sessionId={}", sessionId);
    }

    // ============================================
    // VAQT TUGAGANDA AVTOMATIK SAQLASH
    // ============================================

    /**
     * Vaqti tugagan sessiyani avtomatik tugatish.
     * Frontend beacon API orqali chaqiriladi.
     * Agar sessiya allaqachon tugatilgan bo'lsa - xato bermaydi.
     *
     * @param sessionId Sessiya ID
     * @param answers Yig'ilgan javoblar (bo'sh bo'lishi mumkin)
     * @return Natija yoki null (agar allaqachon tugatilgan bo'lsa)
     */
    @Transactional
    public ExamResultResponse autoSubmitExpired(Long sessionId, List<AnswerSubmitRequest> answers) {
        Long userId = getCurrentUserIdRequired();

        log.info("Auto-submit: sessionId={}, answers={}", sessionId, answers != null ? answers.size() : 0);

        Optional<ExamSession> sessionOpt = sessionRepository.findByIdAndUserId(sessionId, userId);
        if (sessionOpt.isEmpty()) {
            log.warn("Auto-submit: sessiya topilmadi - sessionId={}", sessionId);
            return null;
        }

        ExamSession session = sessionOpt.get();

        // Agar allaqachon tugatilgan bo'lsa - natijani qaytarish
        if (session.getStatus() == ExamStatus.COMPLETED || session.getStatus() == ExamStatus.EXPIRED) {
            log.info("Auto-submit: sessiya allaqachon tugatilgan - sessionId={}", sessionId);
            List<ExamAnswer> existingAnswers = answerRepository.findByExamSessionIdOrderByQuestionOrder(sessionId);
            return buildResultResponse(session, existingAnswers);
        }

        // Javoblarni saqlash
        if (answers != null && !answers.isEmpty()) {
            Map<Long, AnswerSubmitRequest> answerMap = answers.stream()
                    .collect(Collectors.toMap(
                            AnswerSubmitRequest::getQuestionId,
                            a -> a,
                            (a1, a2) -> a2
                    ));

            List<ExamAnswer> examAnswers = answerRepository.findByExamSessionIdOrderByQuestionOrder(session.getId());

            for (ExamAnswer examAnswer : examAnswers) {
                Question question = examAnswer.getQuestion();
                if (question == null) continue;

                AnswerSubmitRequest userAnswer = answerMap.get(question.getId());
                if (userAnswer != null && userAnswer.getSelectedOptionIndex() != null) {
                    examAnswer.submitAnswer(
                            userAnswer.getSelectedOptionIndex(),
                            userAnswer.getTimeSpentSeconds()
                    );
                    question.recordAnswer(examAnswer.getIsCorrect());
                }
            }

            answerRepository.saveAll(examAnswers);
        }

        // Sessiyani EXPIRED qilish
        session.expire();
        session = sessionRepository.save(session);

        // Statistikani yangilash
        updateUserStatisticsSafe(session);

        List<ExamAnswer> finalAnswers = answerRepository.findByExamSessionIdOrderByQuestionOrder(sessionId);

        log.info("Auto-submit tugadi: sessionId={}, score={}/{}",
                session.getId(), session.getCorrectCount(), session.getTotalQuestions());

        return buildResultResponse(session, finalAnswers);
    }

    /**
     * Muddati o'tgan barcha sessiyalarni EXPIRED qilish.
     * Scheduled job tomonidan chaqiriladi.
     *
     * @return O'zgartirilgan sessiyalar soni
     */
    @Transactional
    public int expireOldSessions() {
        LocalDateTime now = LocalDateTime.now();

        List<ExamSession> expiredSessions = sessionRepository
                .findByStatusAndStartedAtBefore(ExamStatus.IN_PROGRESS, now.minusHours(24));

        int count = 0;
        for (ExamSession session : expiredSessions) {
            if (session.isExpired()) {
                session.expire();
                sessionRepository.save(session);
                count++;
                log.debug("Sessiya expired qilindi: sessionId={}", session.getId());
            }
        }

        if (count > 0) {
            log.info("Expired sessions: {}", count);
        }

        return count;
    }

    // ============================================
    // YORDAMCHI METODLAR
    // ============================================

    private Long getCurrentUserIdRequired() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }
        return userId;
    }

    private List<Question> selectAndShuffleQuestions(List<Question> questions, int count) {
        Collections.shuffle(questions);
        return questions.stream()
                .limit(count)
                .collect(Collectors.toList());
    }

    private void loadOptionsForQuestions(List<Question> questions) {
        List<Long> questionIds = questions.stream()
                .map(Question::getId)
                .collect(Collectors.toList());

        Map<Long, List<QuestionOption>> optionsMap = optionRepository
                .findByQuestionIdIn(questionIds)
                .stream()
                .filter(opt -> opt.getQuestion() != null)
                .collect(Collectors.groupingBy(opt -> opt.getQuestion().getId()));

        for (Question question : questions) {
            if (question.getOptions() == null || question.getOptions().isEmpty()) {
                question.setOptions(optionsMap.getOrDefault(question.getId(), new ArrayList<>()));
            }
        }
    }

    private ExamSession createSession(User user, ExamPackage examPackage, List<Question> questions) {
        ExamSession session = ExamSession.builder()
                .user(user)
                .examPackage(examPackage)
                .status(ExamStatus.NOT_STARTED)
                .language(AcceptLanguage.UZL)
                .durationMinutes(examPackage.getDurationMinutes())
                .totalQuestions(questions.size())
                .build();

        session.start();
        session = sessionRepository.save(session);

        List<ExamAnswer> examAnswers = createExamAnswers(session, questions);
        session.setAnswers(examAnswers);

        return session;
    }

    private ExamSession createMarathonSession(User user, List<Question> questions,
                                               int durationMinutes, int passingScore) {
        ExamSession session = ExamSession.builder()
                .user(user)
                .examPackage(null)
                .status(ExamStatus.NOT_STARTED)
                .language(AcceptLanguage.UZL)
                .durationMinutes(durationMinutes)
                .totalQuestions(questions.size())
                .build();

        session.start();
        session = sessionRepository.save(session);

        List<ExamAnswer> examAnswers = createExamAnswers(session, questions);
        session.setAnswers(examAnswers);

        return session;
    }

    private List<ExamAnswer> createExamAnswers(ExamSession session, List<Question> questions) {
        List<ExamAnswer> examAnswers = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            ExamAnswer answer = ExamAnswer.builder()
                    .examSession(session)
                    .question(question)
                    .questionOrder(i)
                    .correctOptionIndex(question.getCorrectAnswerIndex())
                    .build();
            examAnswers.add(answer);
        }
        return answerRepository.saveAll(examAnswers);
    }

    private ExamResultResponse buildResultResponse(ExamSession session, List<ExamAnswer> answers) {
        ExamPackage pkg = session.getExamPackage();
        Ticket ticket = session.getTicket();
        Topic topic = pkg != null ? pkg.getTopic() : (ticket != null ? ticket.getTopic() : null);

        int totalQuestions = session.getTotalQuestions() != null ? session.getTotalQuestions() : 0;
        int correctCount = session.getCorrectCount() != null ? session.getCorrectCount() : 0;
        int answeredCount = session.getAnsweredCount() != null ? session.getAnsweredCount() : 0;
        int incorrectCount = answeredCount - correctCount;
        int unansweredCount = totalQuestions - answeredCount;

        double avgTime = answers.stream()
                .filter(a -> a.getTimeSpentSeconds() != null)
                .mapToLong(ExamAnswer::getTimeSpentSeconds)
                .average()
                .orElse(0.0);

        // Determine passing score
        int passingScore = DEFAULT_PASSING_SCORE;
        if (pkg != null) {
            passingScore = pkg.getPassingScore();
        } else if (ticket != null) {
            passingScore = ticket.getPassingScore();
        }

        return ExamResultResponse.builder()
                .sessionId(session.getId())
                .packageId(pkg != null ? pkg.getId() : null)
                .packageName(mapper.toPackageName(pkg))
                .topicId(topic != null ? topic.getId() : null)
                .topicName(mapper.toTopicName(topic))
                .status(session.getStatus())
                .isMarathonMode(session.isMarathonMode())
                .totalQuestions(totalQuestions)
                .answeredCount(answeredCount)
                .correctCount(correctCount)
                .incorrectCount(incorrectCount)
                .unansweredCount(unansweredCount)
                .score(session.getScore())
                .percentage(session.getPercentage())
                .isPassed(session.getIsPassed())
                .passingScore(passingScore)
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .durationSeconds(session.getDurationSeconds())
                .averageTimePerQuestion(avgTime)
                .answerDetails(mapper.toAnswerDetailResponses(answers))
                .build();
    }

    private ExamStatisticsResponse buildStatisticsResponse(ExamSession session, List<ExamAnswer> answers) {
        int totalQuestions = session.getTotalQuestions() != null ? session.getTotalQuestions() : 0;
        int correctCount = session.getCorrectCount() != null ? session.getCorrectCount() : 0;
        int answeredCount = session.getAnsweredCount() != null ? session.getAnsweredCount() : 0;
        int incorrectCount = answeredCount - correctCount;
        int unansweredCount = totalQuestions - answeredCount;

        // Vaqt statistikasi
        List<Long> times = answers.stream()
                .filter(a -> a.getTimeSpentSeconds() != null)
                .map(ExamAnswer::getTimeSpentSeconds)
                .collect(Collectors.toList());

        double avgTime = times.stream().mapToLong(Long::longValue).average().orElse(0.0);
        Long fastestTime = times.stream().min(Long::compare).orElse(null);
        Long slowestTime = times.stream().max(Long::compare).orElse(null);

        double correctPercentage = totalQuestions > 0 ? (correctCount * 100.0) / totalQuestions : 0.0;
        double unansweredPercentage = totalQuestions > 0 ? (unansweredCount * 100.0) / totalQuestions : 0.0;

        // Determine passing score
        int passingScore = DEFAULT_PASSING_SCORE;
        if (session.getExamPackage() != null) {
            passingScore = session.getExamPackage().getPassingScore();
        } else if (session.getTicket() != null) {
            passingScore = session.getTicket().getPassingScore();
        }

        return ExamStatisticsResponse.builder()
                .sessionId(session.getId())
                .totalQuestions(totalQuestions)
                .answeredCount(answeredCount)
                .correctCount(correctCount)
                .incorrectCount(incorrectCount)
                .unansweredCount(unansweredCount)
                .score(session.getScore())
                .percentage(session.getPercentage())
                .isPassed(session.getIsPassed())
                .passingScore(passingScore)
                .durationSeconds(session.getDurationSeconds())
                .averageTimePerQuestion(avgTime)
                .fastestAnswerTime(fastestTime)
                .slowestAnswerTime(slowestTime)
                .correctPercentage(correctPercentage)
                .unansweredPercentage(unansweredPercentage)
                .isMarathonMode(session.isMarathonMode())
                .build();
    }

    private void updateUserStatisticsSafe(ExamSession session) {
        try {
            String topicCode;
            if (session.getExamPackage() != null && session.getExamPackage().getTopicCode() != null) {
                topicCode = session.getExamPackage().getTopicCode();
            } else {
                topicCode = "marathon";
            }

            if (topicCode.isBlank()) {
                topicCode = "general";
            }

            User user = session.getUser();
            if (user == null) {
                log.warn("Sessiyada foydalanuvchi topilmadi: sessionId={}", session.getId());
                return;
            }

            String finalTopicCode = topicCode;
            UserStatistics stats = statisticsRepository
                    .findByUserIdAndTopic(user.getId(), topicCode)
                    .orElseGet(() -> {
                        UserStatistics newStats = UserStatistics.builder()
                                .user(user)
                                .topic(finalTopicCode)
                                .build();
                        return statisticsRepository.save(newStats);
                    });

            stats.updateFromSession(session);
            statisticsRepository.save(stats);

            log.debug("Statistika yangilandi: user={}, topic={}",
                    user.getId(), topicCode);
        } catch (Exception e) {
            log.warn("Statistikani yangilashda xato: {}", e.getMessage());
        }
    }

    // ============================================
    // PAKET STATISTIKASI
    // ============================================

    /**
     * Paket bo'yicha foydalanuvchi statistikasini olish.
     *
     * @param packageId Paket ID
     * @return Paket statistikasi
     */
    @Transactional(readOnly = true)
    public PackageStatisticsResponse getPackageStatistics(Long packageId) {
        Long userId = getCurrentUserIdRequired();

        log.info("Paket statistikasi so'ralmoqda: user={}, package={}", userId, packageId);

        // Paketni olish
        ExamPackage examPackage = packageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("error.package.not.found"));

        // Foydalanuvchining ushbu paket bo'yicha barcha sessiyalarini olish
        List<ExamSession> userSessions = sessionRepository.findByUserIdAndPackageId(userId, packageId);

        // Statistikani hisoblash
        int completedTests = 0;
        int passedTests = 0;
        int failedTests = 0;
        int totalCorrect = 0;
        int totalIncorrect = 0;
        int totalUnanswered = 0;
        double totalPercentage = 0;
        Double bestPercentage = null;
        Double worstPercentage = null;
        long totalDuration = 0;
        LocalDateTime firstTestDate = null;
        LocalDateTime lastTestDate = null;

        for (ExamSession session : userSessions) {
            if (session.getStatus() == ExamStatus.COMPLETED || session.getStatus() == ExamStatus.EXPIRED) {
                completedTests++;

                int correct = session.getCorrectCount() != null ? session.getCorrectCount() : 0;
                int answered = session.getAnsweredCount() != null ? session.getAnsweredCount() : 0;
                int total = session.getTotalQuestions() != null ? session.getTotalQuestions() : 0;
                double percentage = session.getPercentage() != null ? session.getPercentage() : 0.0;

                totalCorrect += correct;
                totalIncorrect += (answered - correct);
                totalUnanswered += (total - answered);
                totalPercentage += percentage;

                if (Boolean.TRUE.equals(session.getIsPassed())) {
                    passedTests++;
                } else {
                    failedTests++;
                }

                if (bestPercentage == null || percentage > bestPercentage) {
                    bestPercentage = percentage;
                }
                if (worstPercentage == null || percentage < worstPercentage) {
                    worstPercentage = percentage;
                }

                Long duration = session.getDurationSeconds();
                if (duration != null) {
                    totalDuration += duration;
                }

                if (firstTestDate == null ||
                    (session.getStartedAt() != null && session.getStartedAt().isBefore(firstTestDate))) {
                    firstTestDate = session.getStartedAt();
                }
                if (lastTestDate == null ||
                    (session.getFinishedAt() != null && session.getFinishedAt().isAfter(lastTestDate))) {
                    lastTestDate = session.getFinishedAt();
                }
            }
        }

        double avgPercentage = completedTests > 0 ? totalPercentage / completedTests : 0.0;
        double avgDuration = completedTests > 0 ? (double) totalDuration / completedTests : 0.0;
        double successRate = completedTests > 0 ? (passedTests * 100.0) / completedTests : 0.0;

        Topic topic = examPackage.getTopic();

        return PackageStatisticsResponse.builder()
                .packageId(examPackage.getId())
                .packageName(mapper.toPackageName(examPackage))
                .topicId(topic != null ? topic.getId() : null)
                .topicName(mapper.toTopicName(topic))
                .totalQuestionsInPackage(examPackage.getQuestionCount())
                .totalTestsInPackage(1) // Bir paketda bitta test (biletlar alohida)
                .passingScore(examPackage.getPassingScore())
                .durationMinutes(examPackage.getDurationMinutes())
                .completedTests(completedTests)
                .passedTests(passedTests)
                .failedTests(failedTests)
                .totalCorrectAnswers(totalCorrect)
                .totalIncorrectAnswers(totalIncorrect)
                .totalUnansweredQuestions(totalUnanswered)
                .averagePercentage(avgPercentage)
                .bestPercentage(bestPercentage)
                .worstPercentage(worstPercentage)
                .averageTestDuration(avgDuration)
                .lastTestDate(lastTestDate)
                .firstTestDate(firstTestDate)
                .successRate(successRate)
                .build();
    }
}
