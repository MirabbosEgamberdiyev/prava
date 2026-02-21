package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.mapper.StatisticsMapper;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.entity.Ticket;
import uz.pravaimtihon.entity.UserStatistics;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.repository.ExamSessionRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TicketRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.repository.UserStatisticsRepository;
import uz.pravaimtihon.security.SecurityUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * ✅ Statistics Service - 100% Complete with Pagination & Multi-language
 * Supports: UZL, UZC, EN, RU
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StatisticsService {

    private final UserStatisticsRepository statisticsRepository;
    private final ExamSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final ExamPackageRepository packageRepository;
    private final TicketRepository ticketRepository;
    private final StatisticsMapper statisticsMapper;

    // ============================================
    // Cache Eviction
    // ============================================

    /**
     * Evict caches after exam completion.
     */
    @Caching(evict = {
            @CacheEvict(value = "user_stats", allEntries = true),
            @CacheEvict(value = "leaderboard", allEntries = true),
            @CacheEvict(value = "dashboard_stats", allEntries = true)
    })
    public void evictUserCaches(Long userId) {
        log.debug("Evicted caches for user: {}", userId);
    }

    // ============================================
    // User Statistics
    // ============================================

    /**
     * ✅ Get my statistics
     */
    public List<UserStatisticsResponse> getMyStatistics(AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }

        List<UserStatistics> stats = statisticsRepository.findByUserId(userId);
        return statisticsMapper.toResponseList(stats, language);
    }

    /**
     * ✅ Get my statistics by topic
     */
    public UserStatisticsResponse getMyStatisticsByTopic(String topic, AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }

        UserStatistics stats = statisticsRepository
                .findByUserIdAndTopic(userId, topic)
                .orElse(UserStatistics.builder()
                        .topic(topic)
                        .build());

        return statisticsMapper.toResponse(stats, language);
    }

    /**
     * ✅ Get user statistics (Admin)
     */
    public List<UserStatisticsResponse> getUserStatistics(Long userId, AcceptLanguage language) {
        List<UserStatistics> stats = statisticsRepository.findByUserId(userId);
        return statisticsMapper.toResponseList(stats, language);
    }

    // ============================================
    // Leaderboard - With Pagination
    // ============================================

    /**
     * ✅ Get leaderboard by topic with pagination
     */
    @Cacheable(value = "leaderboard", key = "#topic + '-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #language.code")
    public PageResponse<LeaderboardEntryResponse> getLeaderboard(String topic, Pageable pageable, AcceptLanguage language) {
        Page<UserStatistics> page = statisticsRepository.findLeaderboardByTopicPaginated(topic, pageable);

        List<LeaderboardEntryResponse> entries = page.getContent().stream()
                .map(stats -> LeaderboardEntryResponse.builder()
                        .rank((int) (pageable.getPageNumber() * pageable.getPageSize() + page.getContent().indexOf(stats) + 1))
                        .userId(stats.getUser().getId())
                        .userName(stats.getUser().getFullName())
                        .bestScore(stats.getBestScore())
                        .averageScore(stats.getAverageScore())
                        .totalExams(stats.getTotalExams())
                        .currentStreak(stats.getCurrentStreak())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.<LeaderboardEntryResponse>builder()
                .content(entries)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * ✅ Get global leaderboard with pagination
     */
    @Cacheable(value = "leaderboard", key = "'global-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #language.code")
    public PageResponse<LeaderboardEntryResponse> getGlobalLeaderboard(Pageable pageable, AcceptLanguage language) {
        Page<UserStatistics> page = statisticsRepository.findGlobalLeaderboardPaginated(pageable);

        List<LeaderboardEntryResponse> entries = page.getContent().stream()
                .map(stats -> LeaderboardEntryResponse.builder()
                        .rank((int) (pageable.getPageNumber() * pageable.getPageSize() + page.getContent().indexOf(stats) + 1))
                        .userId(stats.getUser().getId())
                        .userName(stats.getUser().getFullName())
                        .bestScore(stats.getBestScore())
                        .averageScore(stats.getAverageScore())
                        .totalExams(stats.getTotalExams())
                        .currentStreak(stats.getCurrentStreak())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.<LeaderboardEntryResponse>builder()
                .content(entries)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // ============================================
    // User Dashboard - To'liq statistika
    // ============================================

    /**
     * ✅ Get user dashboard - to'liq statistika
     */
    public UserDashboardResponse getUserDashboard(AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }

        // Umumiy statistika — null-safe (DB'da null qiymatlar bo'lishi mumkin)
        List<UserStatistics> allStats = statisticsRepository.findByUserId(userId);
        long totalExams = allStats.stream().mapToLong(s -> s.getTotalExams() != null ? s.getTotalExams() : 0).sum();
        long passedExams = allStats.stream().mapToLong(s -> s.getPassedExams() != null ? s.getPassedExams() : 0).sum();
        long failedExams = allStats.stream().mapToLong(s -> s.getFailedExams() != null ? s.getFailedExams() : 0).sum();
        double avgScore = allStats.stream().mapToDouble(s -> s.getAverageScore() != null ? s.getAverageScore() : 0.0).average().orElse(0.0);
        double bestScore = allStats.stream().mapToDouble(s -> s.getBestScore() != null ? s.getBestScore() : 0.0).max().orElse(0.0);
        int currentStreak = allStats.stream().mapToInt(s -> s.getCurrentStreak() != null ? s.getCurrentStreak() : 0).max().orElse(0);
        int longestStreak = allStats.stream().mapToInt(s -> s.getLongestStreak() != null ? s.getLongestStreak() : 0).max().orElse(0);
        long totalTime = allStats.stream().mapToLong(s -> s.getTotalTimeSpentSeconds() != null ? s.getTotalTimeSpentSeconds() : 0L).sum();

        // Package statistikasi — batch load to avoid N+1
        List<UserDashboardResponse.PackageStatItem> packageStats = List.of();
        try {
            List<Object[]> packageSummary = sessionRepository.getPackageStatisticsSummary(userId);
            List<Long> packageIds = packageSummary.stream().map(row -> (Long) row[0]).toList();
            Map<Long, ExamPackage> packageMap = packageRepository.findAllById(packageIds).stream()
                    .collect(Collectors.toMap(ExamPackage::getId, Function.identity()));

            packageStats = packageSummary.stream()
                    .map(row -> {
                        Long pkgId = (Long) row[0];
                        Long count = row[1] != null ? (Long) row[1] : 0L;
                        Long passed = row[2] != null ? (Long) row[2] : 0L;
                        ExamPackage pkg = packageMap.get(pkgId);
                        return UserDashboardResponse.PackageStatItem.builder()
                                .packageId(pkgId)
                                .packageName(pkg != null ? LocalizedText.of(
                                        pkg.getNameUzl(), pkg.getNameUzc(),
                                        pkg.getNameEn(), pkg.getNameRu()) : null)
                                .totalExams(count)
                                .passedExams(passed)
                                .failedExams(count - passed)
                                .build();
                    })
                    .toList();
        } catch (Exception e) {
            log.warn("Error loading package statistics for user {}: {}", userId, e.getMessage());
        }

        // Ticket statistikasi — batch load to avoid N+1
        List<UserDashboardResponse.TicketStatItem> ticketStats = List.of();
        try {
            List<Object[]> ticketSummary = sessionRepository.getTicketStatisticsSummary(userId);
            List<Long> ticketIds = ticketSummary.stream().map(row -> (Long) row[0]).toList();
            Map<Long, Ticket> ticketMap = ticketRepository.findAllById(ticketIds).stream()
                    .collect(Collectors.toMap(Ticket::getId, Function.identity()));

            ticketStats = ticketSummary.stream()
                    .map(row -> {
                        Long ticketId = (Long) row[0];
                        Long count = row[1] != null ? (Long) row[1] : 0L;
                        Long passed = row[2] != null ? (Long) row[2] : 0L;
                        Double avg = row[3] != null ? (Double) row[3] : 0.0;
                        Ticket ticket = ticketMap.get(ticketId);
                        return UserDashboardResponse.TicketStatItem.builder()
                                .ticketId(ticketId)
                                .ticketNumber(ticket != null ? ticket.getTicketNumber() : null)
                                .ticketName(ticket != null ? LocalizedText.of(
                                        ticket.getNameUzl(), ticket.getNameUzc(),
                                        ticket.getNameEn(), ticket.getNameRu()) : null)
                                .totalExams(count)
                                .passedExams(passed)
                                .averageScore(avg)
                                .build();
                    })
                    .toList();
        } catch (Exception e) {
            log.warn("Error loading ticket statistics for user {}: {}", userId, e.getMessage());
        }

        // Marathon statistikasi
        UserDashboardResponse.MarathonStatItem marathonStats = null;
        try {
            Object[] marathonData = sessionRepository.getMarathonStatistics(userId);
            if (marathonData != null && marathonData[0] != null) {
                Long mCount = ((Number) marathonData[0]).longValue();
                Long mPassed = marathonData[1] != null ? ((Number) marathonData[1]).longValue() : 0L;
                Double mAvg = marathonData[2] != null ? ((Number) marathonData[2]).doubleValue() : 0.0;
                Long mCorrect = marathonData[3] != null ? ((Number) marathonData[3]).longValue() : 0L;
                Long mTotal = marathonData[4] != null ? ((Number) marathonData[4]).longValue() : 0L;
                if (mCount > 0) {
                    marathonStats = UserDashboardResponse.MarathonStatItem.builder()
                            .totalExams(mCount)
                            .passedExams(mPassed)
                            .failedExams(mCount - mPassed)
                            .averageScore(mAvg)
                            .totalCorrectAnswers(mCorrect)
                            .totalQuestions(mTotal)
                            .accuracy(mTotal > 0 ? (mCorrect * 100.0 / mTotal) : 0.0)
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("Error loading marathon statistics for user {}: {}", userId, e.getMessage());
        }

        return UserDashboardResponse.builder()
                .totalExams(totalExams)
                .passedExams(passedExams)
                .failedExams(failedExams)
                .averageScore(avgScore)
                .bestScore(bestScore)
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .totalTimeSpentSeconds(totalTime)
                .packageStats(packageStats)
                .ticketStats(ticketStats)
                .marathonStats(marathonStats)
                .build();
    }

    // ============================================
    // Admin Dashboard Statistics
    // ============================================

    /**
     * ✅ Get dashboard statistics - Admin uchun kengaytirilgan
     */
    @Cacheable(value = "dashboard_stats", key = "#language.code")
    public DashboardStatsResponse getDashboardStats(AcceptLanguage language) {
        long totalUsers = userRepository.countActiveUsers();
        long totalQuestions = questionRepository.count();
        long totalPackages = packageRepository.countActivePackages();
        long totalTickets = ticketRepository.countActiveTickets();
        long totalExams = sessionRepository.count();
        long completedExams = sessionRepository.countByStatus(ExamStatus.COMPLETED);
        long activeExams = sessionRepository.countByStatus(ExamStatus.IN_PROGRESS);

        Double averageScore = sessionRepository.calculateAverageScore();
        if (averageScore == null) {
            averageScore = 0.0;
        }

        LocalDateTime today = LocalDate.now().atStartOfDay();
        LocalDateTime weekStart = today.minusDays(7);
        LocalDateTime monthStart = today.minusDays(30);

        long examsToday = sessionRepository.countByStartedAtAfter(today);
        long examsThisWeek = sessionRepository.countByStartedAtAfter(weekStart);
        long examsThisMonth = sessionRepository.countByStartedAtAfter(monthStart);
        long activeUsersToday = sessionRepository.countActiveUsersToday(today);

        // Imtihon turlari bo'yicha
        long ticketExams = sessionRepository.countTicketSessions();
        long marathonExams = sessionRepository.countMarathonSessions();
        long packageExams = totalExams - ticketExams - marathonExams;

        // O'tish statistikasi
        long passedExams = sessionRepository.countByStatus(ExamStatus.COMPLETED);
        // TODO: Add isPassed count query if needed
        double passRate = completedExams > 0 ? (passedExams * 100.0 / completedExams) : 0.0;

        // Mashhur paketlar (top 5)
        Page<Object[]> popularPkgs = sessionRepository.findMostUsedPackages(
                org.springframework.data.domain.PageRequest.of(0, 5));
        List<DashboardStatsResponse.PopularPackageItem> popularPackages = popularPkgs.getContent().stream()
                .map(row -> {
                    Long pkgId = (Long) row[0];
                    Long count = (Long) row[1];
                    ExamPackage pkg = packageRepository.findById(pkgId).orElse(null);
                    return DashboardStatsResponse.PopularPackageItem.builder()
                            .packageId(pkgId)
                            .packageName(pkg != null ? LocalizedText.of(
                                    pkg.getNameUzl(), pkg.getNameUzc(),
                                    pkg.getNameEn(), pkg.getNameRu()) : null)
                            .usageCount(count)
                            .build();
                })
                .toList();

        // Mashhur biletlar (top 5)
        Page<Object[]> popularTkts = sessionRepository.findMostUsedTickets(
                org.springframework.data.domain.PageRequest.of(0, 5));
        List<DashboardStatsResponse.PopularTicketItem> popularTickets = popularTkts.getContent().stream()
                .map(row -> {
                    Long ticketId = (Long) row[0];
                    Long count = (Long) row[1];
                    Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
                    return DashboardStatsResponse.PopularTicketItem.builder()
                            .ticketId(ticketId)
                            .ticketNumber(ticket != null ? ticket.getTicketNumber() : null)
                            .ticketName(ticket != null ? LocalizedText.of(
                                    ticket.getNameUzl(), ticket.getNameUzc(),
                                    ticket.getNameEn(), ticket.getNameRu()) : null)
                            .usageCount(count)
                            .build();
                })
                .toList();

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalQuestions(totalQuestions)
                .totalPackages(totalPackages)
                .totalTickets(totalTickets)
                .totalExams(totalExams)
                .completedExams(completedExams)
                .activeExams(activeExams)
                .averageScore(averageScore)
                .examsToday(examsToday)
                .examsThisWeek(examsThisWeek)
                .examsThisMonth(examsThisMonth)
                .activeUsersToday(activeUsersToday)
                .packageExams(packageExams)
                .ticketExams(ticketExams)
                .marathonExams(marathonExams)
                .passRate(passRate)
                .popularPackages(popularPackages)
                .popularTickets(popularTickets)
                .build();
    }

    /**
     * ✅ Get topic statistics
     */
    @Cacheable(value = "topic_stats", key = "#language.code")
    public List<TopicStatsResponse> getTopicStats(AcceptLanguage language) {
        List<String> topicCodes = questionRepository.findAllDistinctTopicCodes();

        return topicCodes.stream()
                .map(topicCode -> calculateTopicStats(topicCode, language))
                .collect(Collectors.toList());
    }

    // ============================================
    // Exam History - With Pagination
    // ============================================

    /**
     * ✅ Get recent exams with pagination (Admin)
     */
    public PageResponse<ExamSessionResponse> getRecentExams(Pageable pageable, AcceptLanguage language) {
        Page<ExamSession> page = sessionRepository.findRecentTestsPaginated(pageable);

        List<ExamSessionResponse> content = page.getContent().stream()
                .map(session -> toExamSessionResponse(session, language))
                .collect(Collectors.toList());

        return PageResponse.<ExamSessionResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * ✅ Get my exam history with pagination
     */
    public PageResponse<ExamSessionResponse> getMyExamHistory(Pageable pageable, AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }

        Page<ExamSession> page = sessionRepository.findByUserIdOrderByStartedAtDesc(userId, pageable);

        List<ExamSessionResponse> content = page.getContent().stream()
                .map(session -> toExamSessionResponse(session, language))
                .collect(Collectors.toList());

        return PageResponse.<ExamSessionResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * ✅ Get my exams by topic with pagination
     */
    public PageResponse<ExamSessionResponse> getMyExamsByTopic(String topic, Pageable pageable, AcceptLanguage language) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }

        Page<ExamSession> page = sessionRepository.findByUserIdAndTopicCode(userId, topic, pageable);

        List<ExamSessionResponse> content = page.getContent().stream()
                .map(session -> toExamSessionResponse(session, language))
                .collect(Collectors.toList());

        return PageResponse.<ExamSessionResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * ✅ Get user exam history by user ID (Admin)
     */
    public PageResponse<ExamSessionResponse> getUserExamHistory(Long userId, Pageable pageable, AcceptLanguage language) {
        Page<ExamSession> page = sessionRepository.findByUserIdOrderByStartedAtDesc(userId, pageable);

        List<ExamSessionResponse> content = page.getContent().stream()
                .map(session -> toExamSessionResponse(session, language))
                .collect(Collectors.toList());

        return PageResponse.<ExamSessionResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // ============================================
    // Count Methods for Dashboard
    // ============================================

    /**
     * ✅ Get active exams count
     */
    public long getActiveExamsCount() {
        return sessionRepository.countByStatus(ExamStatus.IN_PROGRESS);
    }

    /**
     * ✅ Get completed exams count
     */
    public long getCompletedExamsCount() {
        return sessionRepository.countByStatus(ExamStatus.COMPLETED);
    }

    /**
     * ✅ Get today's exams count
     */
    public long getTodayExamsCount() {
        LocalDateTime today = LocalDate.now().atStartOfDay();
        return sessionRepository.countByStartedAtAfter(today);
    }

    // ============================================
    // Helper Methods
    // ============================================

    /**
     * ✅ Calculate topic statistics
     */
    private TopicStatsResponse calculateTopicStats(String topicCode, AcceptLanguage language) {
        long totalQuestions = questionRepository.countByTopicCode(topicCode);

        List<ExamSession> sessions = sessionRepository
                .findByStatusAndTopicCode(ExamStatus.COMPLETED, topicCode);

        long totalExams = sessions.size();

        double averageScore = sessions.stream()
                .mapToDouble(ExamSession::getPercentage)
                .average()
                .orElse(0.0);

        long passedExams = sessions.stream()
                .filter(ExamSession::getIsPassed)
                .count();

        return TopicStatsResponse.builder()
                .topic(topicCode)
                .totalQuestions(totalQuestions)
                .totalExams(totalExams)
                .averageScore(averageScore)
                .passedExams(passedExams)
                .build();
    }

    /**
     * ✅ Convert ExamSession to ExamSessionResponse with language support
     */
    private ExamSessionResponse toExamSessionResponse(ExamSession session, AcceptLanguage language) {
        ExamPackage examPackage = session.getExamPackage();

        // Get package name in the correct language
        String packageName = examPackage != null ? examPackage.getName(language) : "Unknown Package";

        return ExamSessionResponse.builder()
                .id(session.getId())
                .packageId(examPackage != null ? examPackage.getId() : null)
                .packageName(packageName)
                .status(session.getStatus())
                .language(session.getLanguage())
                .totalQuestions(session.getTotalQuestions())
                .answeredCount(session.getAnsweredCount())
                .correctCount(session.getCorrectCount())
                .score(session.getScore())
                .percentage(session.getPercentage())
                .isPassed(session.getIsPassed())
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .durationSeconds(session.getDurationSeconds())
                .build();
    }
}