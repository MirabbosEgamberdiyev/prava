package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.enums.ExamStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {

    Optional<ExamSession> findByIdAndUserId(Long id, Long userId);

    List<ExamSession> findByUserIdOrderByStartedAtDesc(Long userId);

    Page<ExamSession> findByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);

    Page<ExamSession> findByUserIdAndStatusOrderByStartedAtDesc(
            Long userId, ExamStatus status, Pageable pageable);

    @Query("SELECT es FROM ExamSession es WHERE es.user.id = :userId " +
            "AND es.status = 'IN_PROGRESS' AND es.expiresAt > :now")
    Optional<ExamSession> findActiveSession(@Param("userId") Long userId,
                                            @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(es) FROM ExamSession es WHERE es.user.id = :userId " +
            "AND es.status = 'COMPLETED'")
    long countCompletedByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(es) FROM ExamSession es WHERE es.status = :status")
    long countByStatus(@Param("status") ExamStatus status);

    @Query("SELECT COUNT(es) FROM ExamSession es WHERE es.startedAt > :date")
    long countByStartedAtAfter(@Param("date") LocalDateTime date);

    @Query("SELECT AVG(es.percentage) FROM ExamSession es WHERE es.status = 'COMPLETED'")
    Double calculateAverageScore();

    @Query("SELECT es FROM ExamSession es WHERE es.status = 'IN_PROGRESS' AND es.expiresAt < :now")
    List<ExamSession> findExpiredSessions(@Param("now") LocalDateTime now);

    @Query("SELECT es FROM ExamSession es WHERE es.status = 'COMPLETED' ORDER BY es.finishedAt DESC")
    List<ExamSession> findRecentTests(Pageable pageable);

    // ✅ YaNGI: Topic code bilan ishlash
    @Query("SELECT es FROM ExamSession es " +
            "WHERE es.status = :status " +
            "AND es.examPackage.topic.code = :topicCode")
    List<ExamSession> findByStatusAndTopicCode(
            @Param("status") ExamStatus status,
            @Param("topicCode") String topicCode
    );

    @Query("SELECT es FROM ExamSession es " +
            "LEFT JOIN FETCH es.user " +
            "LEFT JOIN FETCH es.examPackage " +
            "WHERE es.id = :id")
    Optional<ExamSession> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT es FROM ExamSession es " +
            "WHERE es.status = 'COMPLETED' " +
            "ORDER BY es.startedAt DESC")
    Page<ExamSession> findRecentTestsPaginated(Pageable pageable);

    @Query("SELECT es FROM ExamSession es " +
            "JOIN es.examPackage ep " +
            "JOIN ep.topic t " +
            "WHERE es.user.id = :userId AND t.code = :topicCode " +
            "ORDER BY es.startedAt DESC")
    Page<ExamSession> findByUserIdAndTopicCode(
            @Param("userId") Long userId,
            @Param("topicCode") String topicCode,
            Pageable pageable
    );
    // ✅ NEW: Check if question is in user's active exam
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END " +
            "FROM ExamAnswer a " +
            "JOIN a.examSession s " +
            "WHERE s.user.id = :userId " +
            "AND a.question.id = :questionId " +
            "AND s.status IN ('NOT_STARTED', 'IN_PROGRESS') " +
            "AND s.expiresAt > :now")
    boolean existsQuestionInActiveExam(
            @Param("userId") Long userId,
            @Param("questionId") Long questionId,
            @Param("now") LocalDateTime now);

    // ✅ NEW: Count active exams by user
    @Query("SELECT COUNT(s) FROM ExamSession s " +
            "WHERE s.user.id = :userId " +
            "AND s.status IN ('NOT_STARTED', 'IN_PROGRESS') " +
            "AND s.expiresAt > :now")
    long countActiveExamsByUser(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now);

    @Query("SELECT CASE WHEN COUNT(es) > 0 THEN true ELSE false END FROM ExamSession es " +
            "WHERE es.examPackage.id = :packageId " +
            "AND es.status IN ('NOT_STARTED', 'IN_PROGRESS')")
    boolean existsActiveSessionsByPackageId(@Param("packageId") Long packageId);

    // Scheduled job uchun - eskirgan sessiyalarni topish
    List<ExamSession> findByStatusAndStartedAtBefore(ExamStatus status, LocalDateTime before);

    // ============================================
    // ✅ NEW: Package statistikasi uchun
    // ============================================

    /**
     * Foydalanuvchining ma'lum paket bo'yicha barcha sessiyalarini olish.
     */
    @Query("SELECT es FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.examPackage.id = :packageId " +
            "ORDER BY es.startedAt DESC")
    List<ExamSession> findByUserIdAndPackageId(
            @Param("userId") Long userId,
            @Param("packageId") Long packageId);

    /**
     * Foydalanuvchining barcha tugatilgan sessiyalarini paket bo'yicha guruhlash.
     */
    @Query("SELECT es.examPackage.id, COUNT(es), SUM(CASE WHEN es.isPassed = true THEN 1 ELSE 0 END) " +
            "FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.status IN ('COMPLETED', 'EXPIRED') AND es.examPackage IS NOT NULL " +
            "GROUP BY es.examPackage.id")
    List<Object[]> getPackageStatisticsSummary(@Param("userId") Long userId);

    /**
     * Marathon sessiyalarini olish (package null bo'lgan sessiyalar).
     */
    @Query("SELECT es FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.examPackage IS NULL AND es.ticket IS NULL " +
            "ORDER BY es.startedAt DESC")
    Page<ExamSession> findMarathonSessionsByUserId(
            @Param("userId") Long userId,
            Pageable pageable);

    // ============================================
    // ✅ NEW: Ticket statistikasi uchun
    // ============================================

    /**
     * Foydalanuvchining ma'lum bilet bo'yicha barcha sessiyalarini olish.
     */
    @Query("SELECT es FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.ticket.id = :ticketId " +
            "ORDER BY es.startedAt DESC")
    List<ExamSession> findByUserIdAndTicketId(
            @Param("userId") Long userId,
            @Param("ticketId") Long ticketId);

    /**
     * Foydalanuvchining bilet sessiyalarini olish (pagination).
     */
    @Query("SELECT es FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.ticket IS NOT NULL " +
            "ORDER BY es.startedAt DESC")
    Page<ExamSession> findTicketSessionsByUserId(
            @Param("userId") Long userId,
            Pageable pageable);

    /**
     * Foydalanuvchining barcha bilet sessiyalarini guruhlash.
     */
    @Query("SELECT es.ticket.id, COUNT(es), SUM(CASE WHEN es.isPassed = true THEN 1 ELSE 0 END), AVG(es.percentage) " +
            "FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.status IN ('COMPLETED', 'EXPIRED') AND es.ticket IS NOT NULL " +
            "GROUP BY es.ticket.id")
    List<Object[]> getTicketStatisticsSummary(@Param("userId") Long userId);

    /**
     * Marathon statistikasi - tugatilgan marathon sessiyalari.
     */
    @Query("SELECT COUNT(es), SUM(CASE WHEN es.isPassed = true THEN 1 ELSE 0 END), AVG(es.percentage), SUM(es.correctCount), SUM(es.totalQuestions) " +
            "FROM ExamSession es " +
            "WHERE es.user.id = :userId AND es.status IN ('COMPLETED', 'EXPIRED') " +
            "AND es.examPackage IS NULL AND es.ticket IS NULL")
    Object[] getMarathonStatistics(@Param("userId") Long userId);

    // ============================================
    // ✅ ADMIN: Umumiy statistikalar
    // ============================================

    /**
     * Eng ko'p ishlatiladigan paketlar.
     */
    @Query("SELECT es.examPackage.id, COUNT(es) as cnt " +
            "FROM ExamSession es " +
            "WHERE es.examPackage IS NOT NULL " +
            "GROUP BY es.examPackage.id " +
            "ORDER BY cnt DESC")
    Page<Object[]> findMostUsedPackages(Pageable pageable);

    /**
     * Eng ko'p ishlatiladigan biletlar.
     */
    @Query("SELECT es.ticket.id, COUNT(es) as cnt " +
            "FROM ExamSession es " +
            "WHERE es.ticket IS NOT NULL " +
            "GROUP BY es.ticket.id " +
            "ORDER BY cnt DESC")
    Page<Object[]> findMostUsedTickets(Pageable pageable);

    /**
     * Bugungi faol foydalanuvchilar soni.
     */
    @Query("SELECT COUNT(DISTINCT es.user.id) FROM ExamSession es WHERE es.startedAt > :date")
    long countActiveUsersToday(@Param("date") LocalDateTime date);

    /**
     * Umumiy bilet sessiyalari soni.
     */
    @Query("SELECT COUNT(es) FROM ExamSession es WHERE es.ticket IS NOT NULL")
    long countTicketSessions();

    /**
     * Umumiy marathon sessiyalari soni.
     */
    @Query("SELECT COUNT(es) FROM ExamSession es WHERE es.examPackage IS NULL AND es.ticket IS NULL")
    long countMarathonSessions();
}