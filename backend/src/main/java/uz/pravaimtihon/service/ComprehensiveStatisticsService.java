package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.request.StatisticsFilterRequest;
import uz.pravaimtihon.dto.response.ComprehensiveStatisticsResponse;
import uz.pravaimtihon.dto.response.ComprehensiveStatisticsResponse.*;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.*;
import uz.pravaimtihon.security.SecurityUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Mukammal statistika servisi - barcha filterlar bilan.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ComprehensiveStatisticsService {

    private final ExamSessionRepository sessionRepository;
    private final ExamPackageRepository packageRepository;
    private final TicketRepository ticketRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final ExamAnswerRepository answerRepository;

    // ============================================
    // MAIN STATISTICS METHOD
    // ============================================

    /**
     * To'liq statistika olish - barcha filterlar bilan.
     */
    public ComprehensiveStatisticsResponse getStatistics(
            StatisticsFilterRequest filter,
            AcceptLanguage language) {

        log.info("Statistika so'rovi: userId={}, packageId={}, ticketId={}, topicId={}, mode={}",
                filter.getUserId(), filter.getPackageId(), filter.getTicketId(),
                filter.getTopicId(), filter.getMode());

        // Sessiyalarni filter bilan olish
        List<ExamSession> sessions = fetchFilteredSessions(filter);

        // Filter info yaratish
        FilterInfo filterInfo = buildFilterInfo(filter, language);

        // Summary statistika
        SummaryStats summary = calculateSummary(sessions);

        // Vaqt bo'yicha statistika
        TimeBasedStats timeStats = calculateTimeStats(sessions);

        // Batafsil ma'lumotlar
        List<ExamDetailItem> details = null;
        if (filter.getIncludeDetails()) {
            details = buildExamDetails(sessions, filter, language);
        }

        // Trend ma'lumotlari
        List<DailyTrendItem> trend = null;
        if (filter.getIncludeTrend()) {
            trend = calculateDailyTrend(sessions);
        }

        // Breakdown ma'lumotlari
        List<TicketBreakdownItem> ticketStats = buildTicketBreakdown(sessions, language);
        List<PackageBreakdownItem> packageStats = buildPackageBreakdown(sessions, language);
        List<TopicBreakdownItem> topicStats = buildTopicBreakdown(sessions, language);
        MarathonBreakdownItem marathonStats = buildMarathonBreakdown(sessions);

        return ComprehensiveStatisticsResponse.builder()
                .filter(filterInfo)
                .summary(summary)
                .timeStats(timeStats)
                .examDetails(details)
                .dailyTrend(trend)
                .ticketStats(ticketStats.isEmpty() ? null : ticketStats)
                .packageStats(packageStats.isEmpty() ? null : packageStats)
                .topicStats(topicStats.isEmpty() ? null : topicStats)
                .marathonStats(marathonStats)
                .build();
    }

    /**
     * Mening statistikam (joriy user).
     */
    public ComprehensiveStatisticsResponse getMyStatistics(
            StatisticsFilterRequest filter,
            AcceptLanguage language) {

        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }

        filter.setUserId(userId);
        return getStatistics(filter, language);
    }

    // ============================================
    // SPECIFIC STATISTICS METHODS
    // ============================================

    /**
     * Paket bo'yicha statistika.
     */
    public ComprehensiveStatisticsResponse getPackageStatistics(
            Long packageId,
            Long userId,
            AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .packageId(packageId)
                .userId(userId)
                .mode(StatisticsFilterRequest.ExamMode.PACKAGE)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        return getStatistics(filter, language);
    }

    /**
     * Bilet bo'yicha statistika.
     */
    public ComprehensiveStatisticsResponse getTicketStatistics(
            Long ticketId,
            Long userId,
            AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .ticketId(ticketId)
                .userId(userId)
                .mode(StatisticsFilterRequest.ExamMode.TICKET)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        return getStatistics(filter, language);
    }

    /**
     * Mavzu bo'yicha statistika.
     */
    public ComprehensiveStatisticsResponse getTopicStatistics(
            Long topicId,
            Long userId,
            AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .topicId(topicId)
                .userId(userId)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        return getStatistics(filter, language);
    }

    /**
     * Marathon statistikasi.
     */
    public ComprehensiveStatisticsResponse getMarathonStatistics(
            Long userId,
            AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .userId(userId)
                .mode(StatisticsFilterRequest.ExamMode.MARATHON)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        return getStatistics(filter, language);
    }

    /**
     * Foydalanuvchi bo'yicha to'liq statistika.
     */
    public ComprehensiveStatisticsResponse getUserStatistics(
            Long userId,
            AcceptLanguage language) {

        StatisticsFilterRequest filter = StatisticsFilterRequest.builder()
                .userId(userId)
                .includeDetails(true)
                .includeTrend(true)
                .build();

        return getStatistics(filter, language);
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private List<ExamSession> fetchFilteredSessions(StatisticsFilterRequest filter) {
        // Barcha sessiyalarni olish va Java da filter qilish
        // (Keyinchalik murakkab JPA Specification yoki QueryDSL ishlatish mumkin)

        List<ExamSession> allSessions;

        if (filter.getUserId() != null) {
            allSessions = sessionRepository.findByUserIdOrderByStartedAtDesc(filter.getUserId());
        } else {
            allSessions = sessionRepository.findAll(Sort.by(Sort.Direction.DESC, "startedAt"));
        }

        return allSessions.stream()
                .filter(s -> filterByPackage(s, filter.getPackageId()))
                .filter(s -> filterByTicket(s, filter.getTicketId()))
                .filter(s -> filterByTopic(s, filter.getTopicId()))
                .filter(s -> filterByMode(s, filter.getMode()))
                .filter(s -> filterByDateRange(s, filter.getFromDate(), filter.getToDate()))
                .filter(s -> filterByCompleted(s, filter.getCompletedOnly()))
                .filter(s -> filterByPassed(s, filter.getPassedOnly()))
                .collect(Collectors.toList());
    }

    private boolean filterByPackage(ExamSession s, Long packageId) {
        if (packageId == null) return true;
        return s.getExamPackage() != null && s.getExamPackage().getId().equals(packageId);
    }

    private boolean filterByTicket(ExamSession s, Long ticketId) {
        if (ticketId == null) return true;
        return s.getTicket() != null && s.getTicket().getId().equals(ticketId);
    }

    private boolean filterByTopic(ExamSession s, Long topicId) {
        if (topicId == null) return true;
        // Package topic
        if (s.getExamPackage() != null && s.getExamPackage().getTopic() != null
                && s.getExamPackage().getTopic().getId().equals(topicId)) {
            return true;
        }
        // Ticket topic
        if (s.getTicket() != null && s.getTicket().getTopic() != null
                && s.getTicket().getTopic().getId().equals(topicId)) {
            return true;
        }
        return false;
    }

    private boolean filterByMode(ExamSession s, StatisticsFilterRequest.ExamMode mode) {
        if (mode == null || mode == StatisticsFilterRequest.ExamMode.ALL) return true;

        return switch (mode) {
            case MARATHON -> s.getExamPackage() == null && s.getTicket() == null;
            case TICKET -> s.getTicket() != null;
            case PACKAGE -> s.getExamPackage() != null && s.getTicket() == null;
            default -> true;
        };
    }

    private boolean filterByDateRange(ExamSession s, LocalDateTime from, LocalDateTime to) {
        if (from != null && s.getStartedAt() != null && s.getStartedAt().isBefore(from)) {
            return false;
        }
        if (to != null && s.getStartedAt() != null && s.getStartedAt().isAfter(to)) {
            return false;
        }
        return true;
    }

    private boolean filterByCompleted(ExamSession s, Boolean completedOnly) {
        if (!completedOnly) return true;
        return s.getStatus() == ExamStatus.COMPLETED;
    }

    private boolean filterByPassed(ExamSession s, Boolean passedOnly) {
        if (!passedOnly) return true;
        return s.getIsPassed() != null && s.getIsPassed();
    }

    private FilterInfo buildFilterInfo(StatisticsFilterRequest filter, AcceptLanguage language) {
        FilterInfo.FilterInfoBuilder builder = FilterInfo.builder()
                .mode(filter.getMode().name())
                .fromDate(filter.getFromDate())
                .toDate(filter.getToDate());

        // User
        if (filter.getUserId() != null) {
            userRepository.findById(filter.getUserId()).ifPresent(user -> {
                builder.userId(user.getId());
                builder.userName(user.getFullName());
            });
        }

        // Package
        if (filter.getPackageId() != null) {
            packageRepository.findById(filter.getPackageId()).ifPresent(pkg -> {
                builder.packageId(pkg.getId());
                builder.packageName(LocalizedText.of(
                        pkg.getNameUzl(), pkg.getNameUzc(),
                        pkg.getNameEn(), pkg.getNameRu()));
            });
        }

        // Ticket
        if (filter.getTicketId() != null) {
            ticketRepository.findById(filter.getTicketId()).ifPresent(ticket -> {
                builder.ticketId(ticket.getId());
                builder.ticketNumber(ticket.getTicketNumber());
                builder.ticketName(LocalizedText.of(
                        ticket.getNameUzl(), ticket.getNameUzc(),
                        ticket.getNameEn(), ticket.getNameRu()));
            });
        }

        // Topic
        if (filter.getTopicId() != null) {
            topicRepository.findById(filter.getTopicId()).ifPresent(topic -> {
                builder.topicId(topic.getId());
                builder.topicName(LocalizedText.of(
                        topic.getNameUzl(), topic.getNameUzc(),
                        topic.getNameEn(), topic.getNameRu()));
            });
        }

        return builder.build();
    }

    private SummaryStats calculateSummary(List<ExamSession> sessions) {
        if (sessions.isEmpty()) {
            return SummaryStats.builder()
                    .totalExams(0L)
                    .completedExams(0L)
                    .passedExams(0L)
                    .failedExams(0L)
                    .passRate(0.0)
                    .totalQuestions(0L)
                    .correctAnswers(0L)
                    .wrongAnswers(0L)
                    .accuracy(0.0)
                    .averageScore(0.0)
                    .bestScore(0.0)
                    .worstScore(0.0)
                    .build();
        }

        long total = sessions.size();
        long completed = sessions.stream().filter(s -> s.getStatus() == ExamStatus.COMPLETED).count();
        long inProgress = sessions.stream().filter(s -> s.getStatus() == ExamStatus.IN_PROGRESS).count();
        long abandoned = sessions.stream().filter(s -> s.getStatus() == ExamStatus.ABANDONED).count();
        long expired = sessions.stream().filter(s -> s.getStatus() == ExamStatus.EXPIRED).count();

        long passed = sessions.stream().filter(s -> s.getIsPassed() != null && s.getIsPassed()).count();
        long failed = completed - passed;
        double passRate = completed > 0 ? (passed * 100.0 / completed) : 0.0;

        long totalQuestions = sessions.stream().mapToLong(s -> s.getTotalQuestions() != null ? s.getTotalQuestions() : 0).sum();
        long correctAnswers = sessions.stream().mapToLong(s -> s.getCorrectCount() != null ? s.getCorrectCount() : 0).sum();
        long wrongAnswers = sessions.stream().mapToLong(s -> s.getWrongCount() != null ? s.getWrongCount() : 0).sum();
        long unanswered = totalQuestions - correctAnswers - wrongAnswers;
        double accuracy = totalQuestions > 0 ? (correctAnswers * 100.0 / totalQuestions) : 0.0;

        List<Double> scores = sessions.stream()
                .filter(s -> s.getPercentage() != null)
                .map(ExamSession::getPercentage)
                .sorted()
                .toList();

        double avgScore = scores.stream().mapToDouble(d -> d).average().orElse(0.0);
        double bestScore = scores.isEmpty() ? 0.0 : scores.get(scores.size() - 1);
        double worstScore = scores.isEmpty() ? 0.0 : scores.get(0);
        double medianScore = scores.isEmpty() ? 0.0 : scores.get(scores.size() / 2);

        long totalTime = sessions.stream()
                .mapToLong(s -> s.getDurationSeconds() != null ? s.getDurationSeconds() : 0)
                .sum();
        double avgTimePerExam = total > 0 ? (totalTime * 1.0 / total) : 0.0;
        double avgTimePerQuestion = totalQuestions > 0 ? (totalTime * 1.0 / totalQuestions) : 0.0;

        // Streak (faqat completed uchun)
        int currentStreak = 0;
        int longestStreak = 0;
        int tempStreak = 0;

        List<ExamSession> completedSessions = sessions.stream()
                .filter(s -> s.getStatus() == ExamStatus.COMPLETED)
                .sorted(Comparator.comparing(ExamSession::getFinishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        for (ExamSession s : completedSessions) {
            if (s.getIsPassed() != null && s.getIsPassed()) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                if (currentStreak == 0) {
                    currentStreak = tempStreak;
                }
                tempStreak = 0;
            }
        }
        if (currentStreak == 0) {
            currentStreak = tempStreak;
        }

        return SummaryStats.builder()
                .totalExams(total)
                .completedExams(completed)
                .inProgressExams(inProgress)
                .abandonedExams(abandoned)
                .expiredExams(expired)
                .passedExams(passed)
                .failedExams(failed)
                .passRate(Math.round(passRate * 100.0) / 100.0)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .wrongAnswers(wrongAnswers)
                .unansweredQuestions(unanswered)
                .accuracy(Math.round(accuracy * 100.0) / 100.0)
                .averageScore(Math.round(avgScore * 100.0) / 100.0)
                .bestScore(bestScore)
                .worstScore(worstScore)
                .medianScore(medianScore)
                .totalTimeSpentSeconds(totalTime)
                .averageTimePerExamSeconds(Math.round(avgTimePerExam * 100.0) / 100.0)
                .averageTimePerQuestionSeconds(Math.round(avgTimePerQuestion * 100.0) / 100.0)
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .build();
    }

    private TimeBasedStats calculateTimeStats(List<ExamSession> sessions) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime yesterdayStart = todayStart.minusDays(1);
        LocalDateTime weekStart = todayStart.minusDays(7);
        LocalDateTime lastWeekStart = weekStart.minusDays(7);
        LocalDateTime monthStart = todayStart.minusDays(30);
        LocalDateTime lastMonthStart = monthStart.minusDays(30);

        long today = sessions.stream()
                .filter(s -> s.getStartedAt() != null && s.getStartedAt().isAfter(todayStart))
                .count();

        long yesterday = sessions.stream()
                .filter(s -> s.getStartedAt() != null
                        && s.getStartedAt().isAfter(yesterdayStart)
                        && s.getStartedAt().isBefore(todayStart))
                .count();

        long thisWeek = sessions.stream()
                .filter(s -> s.getStartedAt() != null && s.getStartedAt().isAfter(weekStart))
                .count();

        long lastWeek = sessions.stream()
                .filter(s -> s.getStartedAt() != null
                        && s.getStartedAt().isAfter(lastWeekStart)
                        && s.getStartedAt().isBefore(weekStart))
                .count();

        long thisMonth = sessions.stream()
                .filter(s -> s.getStartedAt() != null && s.getStartedAt().isAfter(monthStart))
                .count();

        long lastMonth = sessions.stream()
                .filter(s -> s.getStartedAt() != null
                        && s.getStartedAt().isAfter(lastMonthStart)
                        && s.getStartedAt().isBefore(monthStart))
                .count();

        double avgToday = sessions.stream()
                .filter(s -> s.getStartedAt() != null && s.getStartedAt().isAfter(todayStart))
                .filter(s -> s.getPercentage() != null)
                .mapToDouble(ExamSession::getPercentage)
                .average().orElse(0.0);

        double avgThisWeek = sessions.stream()
                .filter(s -> s.getStartedAt() != null && s.getStartedAt().isAfter(weekStart))
                .filter(s -> s.getPercentage() != null)
                .mapToDouble(ExamSession::getPercentage)
                .average().orElse(0.0);

        double avgThisMonth = sessions.stream()
                .filter(s -> s.getStartedAt() != null && s.getStartedAt().isAfter(monthStart))
                .filter(s -> s.getPercentage() != null)
                .mapToDouble(ExamSession::getPercentage)
                .average().orElse(0.0);

        return TimeBasedStats.builder()
                .examsToday(today)
                .examsYesterday(yesterday)
                .examsThisWeek(thisWeek)
                .examsLastWeek(lastWeek)
                .examsThisMonth(thisMonth)
                .examsLastMonth(lastMonth)
                .averageScoreToday(Math.round(avgToday * 100.0) / 100.0)
                .averageScoreThisWeek(Math.round(avgThisWeek * 100.0) / 100.0)
                .averageScoreThisMonth(Math.round(avgThisMonth * 100.0) / 100.0)
                .build();
    }

    private List<ExamDetailItem> buildExamDetails(
            List<ExamSession> sessions,
            StatisticsFilterRequest filter,
            AcceptLanguage language) {

        int page = filter.getPage();
        int size = filter.getSize();
        int skip = page * size;

        return sessions.stream()
                .skip(skip)
                .limit(size)
                .map(s -> buildExamDetailItem(s, language))
                .toList();
    }

    private ExamDetailItem buildExamDetailItem(ExamSession s, AcceptLanguage language) {
        String examType;
        if (s.getTicket() != null) {
            examType = "TICKET";
        } else if (s.getExamPackage() != null) {
            examType = "PACKAGE";
        } else {
            examType = "MARATHON";
        }

        ExamDetailItem.ExamDetailItemBuilder builder = ExamDetailItem.builder()
                .sessionId(s.getId())
                .startedAt(s.getStartedAt())
                .finishedAt(s.getFinishedAt())
                .durationSeconds(s.getDurationSeconds() != null ? s.getDurationSeconds().intValue() : null)
                .examType(examType)
                .totalQuestions(s.getTotalQuestions())
                .correctCount(s.getCorrectCount())
                .wrongCount(s.getWrongCount())
                .unansweredCount(Math.max(0,
                        (s.getTotalQuestions() != null ? s.getTotalQuestions() : 0)
                        - (s.getCorrectCount() != null ? s.getCorrectCount() : 0)
                        - (s.getWrongCount() != null ? s.getWrongCount() : 0)))
                .percentage(s.getPercentage())
                .isPassed(s.getIsPassed())
                .status(s.getStatus() != null ? s.getStatus().name() : null);

        // Package info
        if (s.getExamPackage() != null) {
            ExamPackage pkg = s.getExamPackage();
            builder.packageId(pkg.getId())
                    .packageName(LocalizedText.of(
                            pkg.getNameUzl(), pkg.getNameUzc(),
                            pkg.getNameEn(), pkg.getNameRu()));

            if (pkg.getTopic() != null) {
                Topic topic = pkg.getTopic();
                builder.topicId(topic.getId())
                        .topicName(LocalizedText.of(
                                topic.getNameUzl(), topic.getNameUzc(),
                                topic.getNameEn(), topic.getNameRu()));
            }
        }

        // Ticket info
        if (s.getTicket() != null) {
            Ticket ticket = s.getTicket();
            builder.ticketId(ticket.getId())
                    .ticketNumber(ticket.getTicketNumber())
                    .ticketName(LocalizedText.of(
                            ticket.getNameUzl(), ticket.getNameUzc(),
                            ticket.getNameEn(), ticket.getNameRu()));

            if (ticket.getTopic() != null) {
                Topic topic = ticket.getTopic();
                builder.topicId(topic.getId())
                        .topicName(LocalizedText.of(
                                topic.getNameUzl(), topic.getNameUzc(),
                                topic.getNameEn(), topic.getNameRu()));
            }
        }

        return builder.build();
    }

    private List<TicketBreakdownItem> buildTicketBreakdown(List<ExamSession> sessions, AcceptLanguage language) {
        return sessions.stream()
                .filter(s -> s.getTicket() != null)
                .collect(Collectors.groupingBy(s -> s.getTicket().getId()))
                .entrySet().stream()
                .map(entry -> {
                    List<ExamSession> ticketSessions = entry.getValue();
                    Ticket ticket = ticketSessions.get(0).getTicket();
                    long total = ticketSessions.size();
                    long passed = ticketSessions.stream()
                            .filter(s -> s.getIsPassed() != null && s.getIsPassed()).count();
                    double avg = ticketSessions.stream()
                            .filter(s -> s.getPercentage() != null)
                            .mapToDouble(ExamSession::getPercentage)
                            .average().orElse(0.0);
                    double best = ticketSessions.stream()
                            .filter(s -> s.getPercentage() != null)
                            .mapToDouble(ExamSession::getPercentage)
                            .max().orElse(0.0);
                    String lastAttempt = ticketSessions.stream()
                            .map(ExamSession::getStartedAt)
                            .filter(Objects::nonNull)
                            .max(Comparator.naturalOrder())
                            .map(dt -> dt.toLocalDate().toString())
                            .orElse(null);
                    return TicketBreakdownItem.builder()
                            .ticketId(ticket.getId())
                            .ticketNumber(ticket.getTicketNumber())
                            .ticketName(LocalizedText.of(
                                    ticket.getNameUzl(), ticket.getNameUzc(),
                                    ticket.getNameEn(), ticket.getNameRu()))
                            .totalExams(total)
                            .passedExams(passed)
                            .averageScore(Math.round(avg * 100.0) / 100.0)
                            .bestScore(Math.round(best * 100.0) / 100.0)
                            .lastAttemptDate(lastAttempt)
                            .build();
                })
                .sorted(Comparator.comparing(TicketBreakdownItem::getTicketNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private List<PackageBreakdownItem> buildPackageBreakdown(List<ExamSession> sessions, AcceptLanguage language) {
        return sessions.stream()
                .filter(s -> s.getExamPackage() != null && s.getTicket() == null)
                .collect(Collectors.groupingBy(s -> s.getExamPackage().getId()))
                .entrySet().stream()
                .map(entry -> {
                    List<ExamSession> pkgSessions = entry.getValue();
                    ExamPackage pkg = pkgSessions.get(0).getExamPackage();
                    long total = pkgSessions.size();
                    long passed = pkgSessions.stream()
                            .filter(s -> s.getIsPassed() != null && s.getIsPassed()).count();
                    long failed = pkgSessions.stream()
                            .filter(s -> s.getStatus() == ExamStatus.COMPLETED)
                            .count() - passed;
                    double avg = pkgSessions.stream()
                            .filter(s -> s.getPercentage() != null)
                            .mapToDouble(ExamSession::getPercentage)
                            .average().orElse(0.0);
                    double best = pkgSessions.stream()
                            .filter(s -> s.getPercentage() != null)
                            .mapToDouble(ExamSession::getPercentage)
                            .max().orElse(0.0);
                    return PackageBreakdownItem.builder()
                            .packageId(pkg.getId())
                            .packageName(LocalizedText.of(
                                    pkg.getNameUzl(), pkg.getNameUzc(),
                                    pkg.getNameEn(), pkg.getNameRu()))
                            .totalExams(total)
                            .passedExams(passed)
                            .failedExams(Math.max(0, failed))
                            .averageScore(Math.round(avg * 100.0) / 100.0)
                            .bestScore(Math.round(best * 100.0) / 100.0)
                            .build();
                })
                .toList();
    }

    private List<TopicBreakdownItem> buildTopicBreakdown(List<ExamSession> sessions, AcceptLanguage language) {
        // Topic ni session dan olish (package yoki ticket orqali)
        Map<Long, List<ExamSession>> byTopic = new HashMap<>();
        Map<Long, Topic> topicMap = new HashMap<>();

        for (ExamSession s : sessions) {
            Topic topic = null;
            if (s.getExamPackage() != null && s.getExamPackage().getTopic() != null) {
                topic = s.getExamPackage().getTopic();
            } else if (s.getTicket() != null && s.getTicket().getTopic() != null) {
                topic = s.getTicket().getTopic();
            }
            if (topic != null) {
                byTopic.computeIfAbsent(topic.getId(), k -> new ArrayList<>()).add(s);
                topicMap.putIfAbsent(topic.getId(), topic);
            }
        }

        return byTopic.entrySet().stream()
                .map(entry -> {
                    Topic topic = topicMap.get(entry.getKey());
                    List<ExamSession> topicSessions = entry.getValue();
                    long total = topicSessions.size();
                    long passed = topicSessions.stream()
                            .filter(s -> s.getIsPassed() != null && s.getIsPassed()).count();
                    double avg = topicSessions.stream()
                            .filter(s -> s.getPercentage() != null)
                            .mapToDouble(ExamSession::getPercentage)
                            .average().orElse(0.0);
                    long totalQ = topicSessions.stream()
                            .mapToLong(s -> s.getTotalQuestions() != null ? s.getTotalQuestions() : 0).sum();
                    long correctA = topicSessions.stream()
                            .mapToLong(s -> s.getCorrectCount() != null ? s.getCorrectCount() : 0).sum();
                    double accuracy = totalQ > 0 ? (correctA * 100.0 / totalQ) : 0.0;
                    return TopicBreakdownItem.builder()
                            .topicId(topic.getId())
                            .topicName(LocalizedText.of(
                                    topic.getNameUzl(), topic.getNameUzc(),
                                    topic.getNameEn(), topic.getNameRu()))
                            .topicCode(topic.getCode())
                            .totalExams(total)
                            .passedExams(passed)
                            .averageScore(Math.round(avg * 100.0) / 100.0)
                            .accuracy(Math.round(accuracy * 100.0) / 100.0)
                            .build();
                })
                .toList();
    }

    private MarathonBreakdownItem buildMarathonBreakdown(List<ExamSession> sessions) {
        List<ExamSession> marathonSessions = sessions.stream()
                .filter(s -> s.getExamPackage() == null && s.getTicket() == null)
                .toList();

        if (marathonSessions.isEmpty()) {
            return null;
        }

        long total = marathonSessions.size();
        long passed = marathonSessions.stream()
                .filter(s -> s.getIsPassed() != null && s.getIsPassed()).count();
        long failed = marathonSessions.stream()
                .filter(s -> s.getStatus() == ExamStatus.COMPLETED).count() - passed;
        double avg = marathonSessions.stream()
                .filter(s -> s.getPercentage() != null)
                .mapToDouble(ExamSession::getPercentage)
                .average().orElse(0.0);
        long totalQ = marathonSessions.stream()
                .mapToLong(s -> s.getTotalQuestions() != null ? s.getTotalQuestions() : 0).sum();
        long correctA = marathonSessions.stream()
                .mapToLong(s -> s.getCorrectCount() != null ? s.getCorrectCount() : 0).sum();
        double accuracy = totalQ > 0 ? (correctA * 100.0 / totalQ) : 0.0;

        return MarathonBreakdownItem.builder()
                .totalExams(total)
                .passedExams(passed)
                .failedExams(Math.max(0, failed))
                .averageScore(Math.round(avg * 100.0) / 100.0)
                .totalCorrectAnswers(correctA)
                .totalQuestions(totalQ)
                .accuracy(Math.round(accuracy * 100.0) / 100.0)
                .build();
    }

    private List<DailyTrendItem> calculateDailyTrend(List<ExamSession> sessions) {
        // Oxirgi 30 kun
        LocalDate today = LocalDate.now();
        Map<LocalDate, List<ExamSession>> byDate = sessions.stream()
                .filter(s -> s.getStartedAt() != null)
                .filter(s -> s.getStartedAt().toLocalDate().isAfter(today.minusDays(30)))
                .collect(Collectors.groupingBy(s -> s.getStartedAt().toLocalDate()));

        List<DailyTrendItem> trend = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            List<ExamSession> daySessions = byDate.getOrDefault(date, Collections.emptyList());

            long examCount = daySessions.size();
            long passedCount = daySessions.stream()
                    .filter(s -> s.getIsPassed() != null && s.getIsPassed())
                    .count();
            long failedCount = daySessions.stream()
                    .filter(s -> s.getStatus() == ExamStatus.COMPLETED && (s.getIsPassed() == null || !s.getIsPassed()))
                    .count();
            double avgScore = daySessions.stream()
                    .filter(s -> s.getPercentage() != null)
                    .mapToDouble(ExamSession::getPercentage)
                    .average().orElse(0.0);
            long totalQ = daySessions.stream()
                    .mapToLong(s -> s.getTotalQuestions() != null ? s.getTotalQuestions() : 0)
                    .sum();
            long correctA = daySessions.stream()
                    .mapToLong(s -> s.getCorrectCount() != null ? s.getCorrectCount() : 0)
                    .sum();

            trend.add(DailyTrendItem.builder()
                    .date(date.atStartOfDay())
                    .examCount(examCount)
                    .passedCount(passedCount)
                    .failedCount(failedCount)
                    .averageScore(Math.round(avgScore * 100.0) / 100.0)
                    .totalQuestions(totalQ)
                    .correctAnswers(correctA)
                    .build());
        }

        return trend;
    }
}
