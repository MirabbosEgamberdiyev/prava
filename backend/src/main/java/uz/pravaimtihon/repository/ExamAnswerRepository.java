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