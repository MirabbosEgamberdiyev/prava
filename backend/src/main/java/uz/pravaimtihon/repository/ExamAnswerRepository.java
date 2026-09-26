package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.ExamAnswer;

import java.util.List;

public interface ExamAnswerRepository extends JpaRepository<ExamAnswer, Long> {

    @Query("SELECT AVG(ea.timeSpentSeconds) FROM ExamAnswer ea " +
            "WHERE ea.question.id = :questionId AND ea.isCorrect = true")
    Double averageTimeForCorrectAnswers(@Param("questionId") Long questionId);
    /**
     * Find all answers for an exam session, ordered by question order
     */
    @Query("SELECT ea FROM ExamAnswer ea " +
            "LEFT JOIN FETCH ea.question q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE ea.examSession.id = :sessionId " +
            "ORDER BY ea.questionOrder ASC")
    List<ExamAnswer> findByExamSessionIdOrderByQuestionOrder(@Param("sessionId") Long sessionId);

    /** Savol foydalanuvchining hozir davom etayotgan imtihonida bormi (check-answer uchun). */
    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM ExamAnswer a " +
            "WHERE a.question.id = :questionId AND a.examSession.user.id = :userId " +
            "AND a.examSession.status = uz.pravaimtihon.enums.ExamStatus.IN_PROGRESS")
    boolean existsInActiveSession(@Param("userId") Long userId, @Param("questionId") Long questionId);

    /** Savolning foydalanuvchi faol sessiyasidagi javob yozuvi (eng yangi sessiya birinchi). */
    @Query("SELECT a FROM ExamAnswer a WHERE a.question.id = :questionId AND a.examSession.user.id = :userId " +
            "AND a.examSession.status = uz.pravaimtihon.enums.ExamStatus.IN_PROGRESS ORDER BY a.examSession.startedAt DESC")
    List<ExamAnswer> findInActiveSessions(@Param("userId") Long userId, @Param("questionId") Long questionId);

    /**
     * Count answers for a session
     */
    long countByExamSessionId(Long sessionId);

    /**
     * Count answered questions for a session
     */
    @Query("SELECT COUNT(ea) FROM ExamAnswer ea WHERE ea.examSession.id = :sessionId AND ea.selectedOptionIndex IS NOT NULL")
    long countAnsweredByExamSessionId(@Param("sessionId") Long sessionId);

    /**
     * Count correct answers for a session
     */
    @Query("SELECT COUNT(ea) FROM ExamAnswer ea WHERE ea.examSession.id = :sessionId AND ea.isCorrect = true")
    long countCorrectByExamSessionId(@Param("sessionId") Long sessionId);
}