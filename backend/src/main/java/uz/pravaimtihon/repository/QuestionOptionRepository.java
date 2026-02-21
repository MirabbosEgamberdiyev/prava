package uz.pravaimtihon.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.QuestionOption;

import java.util.List;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {

    List<QuestionOption> findByQuestionIdOrderByOptionIndex(Long questionId);

    @Query("SELECT qo FROM QuestionOption qo WHERE qo.question.id IN :questionIds " +
            "ORDER BY qo.question.id, qo.optionIndex")
    List<QuestionOption> findByQuestionIds(@Param("questionIds") List<Long> questionIds);

    /**
     * ✅ NEW: Batch load options for multiple questions
     * Used to avoid N+1 query problem
     */
    @Query("SELECT o FROM QuestionOption o " +
            "JOIN FETCH o.question q " +
            "WHERE q.id IN :questionIds " +
            "ORDER BY q.id, o.optionIndex")
    List<QuestionOption> findByQuestionIdIn(@Param("questionIds") List<Long> questionIds);


    /**
     * ✅ EXISTING: Delete options by question ID
     */
    void deleteByQuestionId(Long questionId);

    /**
     * ✅ EXISTING: Count options for question
     */
    long countByQuestionId(Long questionId);

    /**
     * ✅ NEW: Check if option exists
     */
    boolean existsByQuestionIdAndOptionIndex(Long questionId, Integer optionIndex);
}