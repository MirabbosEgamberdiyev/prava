package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.request.TicketCreateRequest;
import uz.pravaimtihon.dto.request.TicketStartRequest;
import uz.pravaimtihon.dto.response.exam.*;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.*;
import uz.pravaimtihon.security.SecurityUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Bilet (Ticket) Service - biletlar bilan ishlash.
 * Biletda minimal 10 ta savol bo'ladi, lekin 15, 20, 25 va hokazo ham bo'lishi mumkin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final QuestionRepository questionRepository;
    private final ExamPackageRepository packageRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final ExamSessionRepository sessionRepository;
    private final ExamAnswerRepository answerRepository;
    private final ExamResponseMapper mapper;

    // ============================================
    // BILET YARATISH
    // ============================================

    /**
     * Yangi bilet yaratish.
     * Minimal 10 ta savol talab qilinadi (10, 15, 20, 25, ...).
     * Agar bir xil savollar bilan bilet mavjud bo'lsa, mavjud biletni qaytaradi.
     */
    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request) {
        log.info("Bilet yaratilmoqda: packageId={}, topicId={}, questions={}",
                request.getPackageId(), request.getTopicId(), request.getQuestionIds().size());

        // Savollarni olish
        List<Question> questions = questionRepository.findByIdsWithOptions(request.getQuestionIds());

        // Barcha so'ralgan savollar topildimi tekshirish
        if (questions.size() != request.getQuestionIds().size()) {
            Set<Long> foundIds = new HashSet<>();
            for (Question q : questions) {
                foundIds.add(q.getId());
            }
            List<Long> missingIds = new ArrayList<>();
            for (Long id : request.getQuestionIds()) {
                if (!foundIds.contains(id)) {
                    missingIds.add(id);
                }
            }
            log.warn("Ba'zi savollar topilmadi yoki faol emas: {}", missingIds);
            throw new BusinessException("error.ticket.questions.not.found");
        }

        // Savollarni so'ralgan tartibda qayta tartiblash
        Map<Long, Question> questionMap = new HashMap<>();
        for (Question q : questions) {
            questionMap.put(q.getId(), q);
        }
        List<Question> orderedQuestions = new ArrayList<>();
        for (Long id : request.getQuestionIds()) {
            orderedQuestions.add(questionMap.get(id));
        }
        questions = orderedQuestions;

        // Minimal 10 ta savol tekshiruvi
        if (questions.size() < Ticket.MIN_QUESTIONS_PER_TICKET) {
            throw new BusinessException("error.ticket.questions.min.count");
        }

        // Target savol sonini aniqlash
        int targetCount = request.getQuestionCount() != null
                ? Math.max(request.getQuestionCount(), Ticket.MIN_QUESTIONS_PER_TICKET)
                : questions.size();

        // Agar savollar soni targetdan kam bo'lsa xatolik
        if (questions.size() < targetCount) {
            throw new BusinessException("error.ticket.questions.insufficient");
        }

        // Paket va mavzuni olish (agar mavjud bo'lsa)
        ExamPackage examPackage = null;
        Topic topic = null;

        if (request.getPackageId() != null) {
            examPackage = packageRepository.findById(request.getPackageId())
                    .orElseThrow(() -> new ResourceNotFoundException("error.package.not.found"));
        }

        if (request.getTopicId() != null) {
            topic = topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new ResourceNotFoundException("error.topic.not.found"));
        }

        // Bilet raqamini belgilash
        int ticketNumber = request.getTicketNumber() != null
                ? request.getTicketNumber()
                : getNextTicketNumber(examPackage, topic);

        // TicketNumber unique bo'lishi kerak (package yoki topic ichida)
        if (request.getPackageId() != null) {
            if (ticketRepository.existsByTicketNumberAndExamPackageIdAndDeletedFalse(ticketNumber, request.getPackageId())) {
                log.info("Bilet #{} packageId={} da allaqachon mavjud", ticketNumber, request.getPackageId());
                // Mavjud biletni qaytarish
                Ticket existingTicket = findTicketByNumberAndPackage(ticketNumber, request.getPackageId());
                if (existingTicket != null) {
                    return toTicketResponse(existingTicket, false);
                }
                throw new BusinessException("error.ticket.number.exists");
            }
        } else if (request.getTopicId() != null) {
            if (ticketRepository.existsByTicketNumberAndTopicIdAndDeletedFalse(ticketNumber, request.getTopicId())) {
                log.info("Bilet #{} topicId={} da allaqachon mavjud", ticketNumber, request.getTopicId());
                // Mavjud biletni qaytarish
                Ticket existingTicket = findTicketByNumberAndTopic(ticketNumber, request.getTopicId());
                if (existingTicket != null) {
                    return toTicketResponse(existingTicket, false);
                }
                throw new BusinessException("error.ticket.number.exists");
            }
        }

        // Bilet yaratish
        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumber)
                .nameUzl(request.getNameUzl() != null ? request.getNameUzl() : Ticket.generateDefaultName(ticketNumber, AcceptLanguage.UZL))
                .nameUzc(request.getNameUzc() != null ? request.getNameUzc() : Ticket.generateDefaultName(ticketNumber, AcceptLanguage.UZC))
                .nameEn(request.getNameEn() != null ? request.getNameEn() : Ticket.generateDefaultName(ticketNumber, AcceptLanguage.EN))
                .nameRu(request.getNameRu() != null ? request.getNameRu() : Ticket.generateDefaultName(ticketNumber, AcceptLanguage.RU))
                .descriptionUzl(request.getDescriptionUzl())
                .descriptionUzc(request.getDescriptionUzc())
                .descriptionEn(request.getDescriptionEn())
                .descriptionRu(request.getDescriptionRu())
                .examPackage(examPackage)
                .topic(topic)
                .questions(new ArrayList<>(questions))
                .targetQuestionCount(targetCount)
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 15)
                .passingScore(request.getPassingScore() != null ? request.getPassingScore() : 70)
                .isActive(true)
                .build();

        ticket = ticketRepository.save(ticket);

        log.info("Bilet yaratildi: id={}, number={}, questionCount={}", ticket.getId(), ticketNumber, targetCount);

        return toTicketResponse(ticket, false);
    }

    // ============================================
    // BILETNI OLISH
    // ============================================

    /**
     * Biletni ID bo'yicha olish.
     */
    @Transactional(readOnly = true)
    public TicketResponse getTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findByIdAndDeletedFalse(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("error.ticket.not.found"));

        return toTicketResponse(ticket, false);
    }

    /**
     * Bilet detail - savollar bilan.
     */
    @Transactional(readOnly = true)
    public TicketResponse getTicketDetail(Long ticketId) {
        Ticket ticket = ticketRepository.findByIdWithQuestionsAndOptions(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("error.ticket.not.found"));

        return toTicketResponse(ticket, true);
    }

    /**
     * Biletni yangilash.
     */
    @Transactional
    public TicketResponse updateTicket(Long ticketId, TicketCreateRequest request) {
        Ticket ticket = ticketRepository.findByIdAndDeletedFalse(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("error.ticket.not.found"));

        // Update names
        if (request.getNameUzl() != null) ticket.setNameUzl(request.getNameUzl());
        if (request.getNameUzc() != null) ticket.setNameUzc(request.getNameUzc());
        if (request.getNameEn() != null) ticket.setNameEn(request.getNameEn());
        if (request.getNameRu() != null) ticket.setNameRu(request.getNameRu());

        // Update descriptions
        if (request.getDescriptionUzl() != null) ticket.setDescriptionUzl(request.getDescriptionUzl());
        if (request.getDescriptionUzc() != null) ticket.setDescriptionUzc(request.getDescriptionUzc());
        if (request.getDescriptionEn() != null) ticket.setDescriptionEn(request.getDescriptionEn());
        if (request.getDescriptionRu() != null) ticket.setDescriptionRu(request.getDescriptionRu());

        // Update settings
        if (request.getDurationMinutes() != null) ticket.setDurationMinutes(request.getDurationMinutes());
        if (request.getPassingScore() != null) ticket.setPassingScore(request.getPassingScore());

        // Update questions if provided
        if (request.getQuestionIds() != null && !request.getQuestionIds().isEmpty()) {
            List<Question> questions = questionRepository.findByIdsWithOptions(request.getQuestionIds());
            if (questions.size() < Ticket.MIN_QUESTIONS_PER_TICKET) {
                throw new BusinessException("error.ticket.questions.min.count");
            }
            // Reorder by requested order
            Map<Long, Question> questionMap = new HashMap<>();
            for (Question q : questions) {
                questionMap.put(q.getId(), q);
            }
            List<Question> orderedQuestions = new ArrayList<>();
            for (Long id : request.getQuestionIds()) {
                Question q = questionMap.get(id);
                if (q != null) orderedQuestions.add(q);
            }
            ticket.setQuestions(orderedQuestions);
            if (request.getQuestionCount() != null) {
                ticket.setTargetQuestionCount(Math.max(request.getQuestionCount(), Ticket.MIN_QUESTIONS_PER_TICKET));
            } else {
                ticket.setTargetQuestionCount(orderedQuestions.size());
            }
        }

        ticket = ticketRepository.save(ticket);
        log.info("Bilet yangilandi: id={}", ticketId);

        return toTicketResponse(ticket, false);
    }

    /**
     * Paket bo'yicha biletlar ro'yxati.
     */
    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByPackage(Long packageId) {
        List<Ticket> tickets = ticketRepository.findByPackageIdOrderByTicketNumber(packageId);
        return tickets.stream()
                .map(t -> toTicketResponse(t, false))
                .toList();
    }

    /**
     * Mavzu bo'yicha biletlar ro'yxati.
     */
    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByTopic(Long topicId) {
        List<Ticket> tickets = ticketRepository.findByTopicIdOrderByTicketNumber(topicId);
        return tickets.stream()
                .map(t -> toTicketResponse(t, false))
                .toList();
    }

    /**
     * Barcha biletlar (pagination bilan).
     */
    @Transactional(readOnly = true)
    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        Page<Ticket> tickets = ticketRepository.findByDeletedFalseAndIsActiveTrue(pageable);
        return tickets.map(t -> toTicketResponse(t, false));
    }

    // ============================================
    // BILET ORQALI TEST BOSHLASH
    // ============================================

    /**
     * Bilet orqali test boshlash (visible mode).
     */
    @Transactional
    public ExamResponse startTicketVisible(TicketStartRequest request) {
        return startTicketInternal(request, true);
    }

    /**
     * Bilet orqali test boshlash (secure mode).
     */
    @Transactional
    public ExamResponse startTicketSecure(TicketStartRequest request) {
        return startTicketInternal(request, false);
    }

    private ExamResponse startTicketInternal(TicketStartRequest request, boolean visibleMode) {
        Long userId = getCurrentUserIdRequired();

        log.info("Bilet test boshlanmoqda: user={}, ticket={}, visible={}",
                userId, request.getTicketId(), visibleMode);

        // Foydalanuvchini olish
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));

        // Biletni savollar bilan olish
        Ticket ticket = ticketRepository.findByIdWithQuestionsAndOptions(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("error.ticket.not.found"));

        if (!ticket.getIsActive()) {
            throw new BusinessException("error.ticket.not.active");
        }

        if (!ticket.hasEnoughQuestions()) {
            throw new BusinessException("error.ticket.insufficient.questions");
        }

        List<Question> questions = ticket.getQuestions();

        // Sessiya yaratish
        ExamSession session = createTicketSession(user, ticket, questions);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(ticket.getDurationMinutes());

        log.info("Bilet test boshlandi: sessionId={}, ticketNumber={}, questions={}",
                session.getId(), ticket.getTicketNumber(), questions.size());

        Topic topic = ticket.getTopic();
        ExamPackage pkg = ticket.getExamPackage();

        return ExamResponse.builder()
                .sessionId(session.getId())
                .packageId(pkg != null ? pkg.getId() : null)
                .packageName(pkg != null ? mapper.toPackageName(pkg) : null)
                .topicId(topic != null ? topic.getId() : null)
                .topicName(topic != null ? mapper.toTopicName(topic) : null)
                .totalQuestions(questions.size())
                .durationMinutes(ticket.getDurationMinutes())
                .passingScore(ticket.getPassingScore())
                .startedAt(now)
                .expiresAt(expiresAt)
                .isMarathonMode(false)
                .isVisibleMode(visibleMode)
                .questions(mapper.toQuestionResponses(questions, visibleMode))
                .build();
    }

    private ExamSession createTicketSession(User user, Ticket ticket, List<Question> questions) {
        ExamSession session = ExamSession.builder()
                .user(user)
                .examPackage(ticket.getExamPackage())
                .ticket(ticket)
                .status(ExamStatus.NOT_STARTED)
                .language(AcceptLanguage.UZL)
                .durationMinutes(ticket.getDurationMinutes())
                .totalQuestions(questions.size())
                .build();

        session.start();
        session = sessionRepository.save(session);

        // ExamAnswer yaratish
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
        answerRepository.saveAll(examAnswers);
        session.setAnswers(examAnswers);

        return session;
    }

    // ============================================
    // BILET O'CHIRISH
    // ============================================

    /**
     * Biletni o'chirish (soft delete).
     */
    @Transactional
    public void deleteTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findByIdAndDeletedFalse(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("error.ticket.not.found"));

        ticket.softDelete(String.valueOf(getCurrentUserIdRequired()));
        ticketRepository.save(ticket);

        log.info("Bilet o'chirildi: id={}", ticketId);
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

    private int getNextTicketNumber(ExamPackage examPackage, Topic topic) {
        if (examPackage != null) {
            return ticketRepository.findMaxTicketNumberByPackageId(examPackage.getId()) + 1;
        } else if (topic != null) {
            return ticketRepository.findMaxTicketNumberByTopicId(topic.getId()) + 1;
        }
        return 1;
    }

    /**
     * Bilet raqami va paket bo'yicha biletni topish.
     */
    private Ticket findTicketByNumberAndPackage(int ticketNumber, Long packageId) {
        return ticketRepository.findByTicketNumberAndExamPackageIdAndDeletedFalse(ticketNumber, packageId)
                .orElse(null);
    }

    /**
     * Bilet raqami va mavzu bo'yicha biletni topish.
     */
    private Ticket findTicketByNumberAndTopic(int ticketNumber, Long topicId) {
        return ticketRepository.findByTicketNumberAndTopicIdAndDeletedFalse(ticketNumber, topicId)
                .orElse(null);
    }

    private TicketResponse toTicketResponse(Ticket ticket, boolean includeQuestions) {
        ExamPackage pkg = ticket.getExamPackage();
        Topic topic = ticket.getTopic();

        TicketResponse.TicketResponseBuilder builder = TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .name(LocalizedText.of(ticket.getNameUzl(), ticket.getNameUzc(), ticket.getNameEn(), ticket.getNameRu()))
                .description(LocalizedText.of(ticket.getDescriptionUzl(), ticket.getDescriptionUzc(), ticket.getDescriptionEn(), ticket.getDescriptionRu()))
                .packageId(pkg != null ? pkg.getId() : null)
                .packageName(pkg != null ? mapper.toPackageName(pkg) : null)
                .topicId(topic != null ? topic.getId() : null)
                .topicName(topic != null ? mapper.toTopicName(topic) : null)
                .questionCount(ticket.getQuestionCount())
                .durationMinutes(ticket.getDurationMinutes())
                .passingScore(ticket.getPassingScore())
                .isActive(ticket.getIsActive());

        if (includeQuestions && ticket.getQuestions() != null) {
            builder.questions(mapper.toQuestionResponses(ticket.getQuestions(), false));
        }

        return builder.build();
    }
}
