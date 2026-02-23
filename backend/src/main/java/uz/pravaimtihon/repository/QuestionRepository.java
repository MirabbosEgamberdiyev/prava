package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.QuestionDifficulty;

import jakarta.persistence.QueryHint;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    Page<Question> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    Page<Question> findByTopicAndDeletedFalseAndIsActiveTrue(Topic topic, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.topic.id = :topicId AND q.deleted = false AND q.isActive = true")
    Page<Question> findByTopicIdAndDeletedFalseAndIsActiveTrue(@Param("topicId") Long topicId, Pageable pageable);

    Page<Question> findByDifficultyAndDeletedFalseAndIsActiveTrue(QuestionDifficulty difficulty, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true AND q.topic.id = :topicId ORDER BY FUNCTION('RANDOM')")
    List<Question> findRandomByTopicId(@Param("topicId") Long topicId, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true AND q.topic = :topic ORDER BY FUNCTION('RANDOM')")
    List<Question> findRandomByTopic(@Param("topic") Topic topic, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true AND q.difficulty = :difficulty ORDER BY FUNCTION('RANDOM')")
    List<Question> findRandomByDifficulty(@Param("difficulty") QuestionDifficulty difficulty, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true ORDER BY FUNCTION('RANDOM')")
    List<Question> findRandomQuestions(Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true AND " +
            "(LOWER(q.textUzl) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(q.textUzc) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(q.textEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(q.textRu) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Question> searchQuestions(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(q) > 0 FROM Question q WHERE q.textUzl = :textUzl AND q.topic = :topic AND q.deleted = false")
    boolean existsByTextUzlAndTopicAndDeletedFalse(@Param("textUzl") String textUzl, @Param("topic") Topic topic);

    @Query("SELECT COUNT(q) > 0 FROM Question q WHERE q.textUzl = :textUzl AND q.topic = :topic AND q.id != :id AND q.deleted = false")
    boolean existsByTextUzlAndTopicAndIdNotAndDeletedFalse(@Param("textUzl") String textUzl, @Param("topic") Topic topic, @Param("id") Long id);

    long countByTopicAndDeletedFalseAndIsActiveTrue(Topic topic);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.topic.id = :topicId AND q.deleted = false AND q.isActive = true")
    long countByTopicIdAndDeletedFalseAndIsActiveTrue(@Param("topicId") Long topicId);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.topic.code = :topicCode AND q.deleted = false AND q.isActive = true")
    long countByTopicCode(@Param("topicCode") String topicCode);

    @Query("SELECT COUNT(q) FROM Question q WHERE q.topic = :topic AND q.difficulty = :difficulty AND q.deleted = false AND q.isActive = true")
    long countByTopicAndDifficultyAndDeletedFalseAndIsActiveTrue(@Param("topic") Topic topic, @Param("difficulty") QuestionDifficulty difficulty);

    @Query("SELECT DISTINCT q.topic.code FROM Question q WHERE q.deleted = false AND q.isActive = true AND q.topic IS NOT NULL ORDER BY q.topic.code")
    List<String> findAllDistinctTopicCodes();

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true AND q.timesUsed > 10 AND (q.timesAnsweredCorrectly * 100.0 / q.timesUsed) < :threshold ORDER BY (q.timesAnsweredCorrectly * 100.0 / q.timesUsed)")
    List<Question> findQuestionsWithLowSuccessRate(@Param("threshold") double threshold, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true ORDER BY q.timesUsed DESC")
    List<Question> findMostUsedQuestions(Pageable pageable);

    @Query("SELECT AVG(CASE WHEN q.timesUsed > 0 THEN (q.timesAnsweredCorrectly * 100.0 / q.timesUsed) ELSE 0 END) FROM Question q WHERE q.topic.id = :topicId AND q.deleted = false AND q.isActive = true")
    Double findAverageSuccessRateByTopicId(@Param("topicId") Long topicId);

    // ============================================
    // ✅ OPTIMIZED: Streaming Methods for Memory Efficiency
    // ============================================

    /**
     * Stream all active questions without loading into memory.
     * MUST be called within @Transactional(readOnly = true) context.
     * Remember to close the stream after use.
     */
    @Query("SELECT q FROM Question q WHERE q.deleted = false AND q.isActive = true")
    @QueryHints(value = {
            @QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_FETCH_SIZE, value = "100"),
            @QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_CACHEABLE, value = "false")
    })
    Stream<Question> streamActiveQuestions();

    /**
     * Stream active questions by topic without loading into memory.
     * MUST be called within @Transactional(readOnly = true) context.
     * Remember to close the stream after use.
     */
    @Query("SELECT q FROM Question q WHERE q.topic = :topic AND q.deleted = false AND q.isActive = true")
    @QueryHints(value = {
            @QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_FETCH_SIZE, value = "100"),
            @QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_CACHEABLE, value = "false")
    })
    Stream<Question> streamActiveQuestionsByTopic(@Param("topic") Topic topic);

    /**
     * Count total active questions (optimized for validation).
     */
    @Query("SELECT COUNT(q) FROM Question q WHERE q.deleted = false AND q.isActive = true")
    long countActiveQuestions();

    /**
     * Count active questions by topic (optimized for validation).
     */
    @Query("SELECT COUNT(q) FROM Question q WHERE q.topic = :topic AND q.deleted = false AND q.isActive = true")
    long countActiveQuestionsByTopic(@Param("topic") Topic topic);

    // ============================================
    // ✅ NEW: Methods with JOIN FETCH for options (Marathon mode)
    // ============================================

    /**
     * Find questions by topic WITH options eagerly loaded.
     * Use this for marathon mode to avoid LazyInitializationException.
     * Note: Shuffling is done in Java (selectAndShuffleQuestions) to avoid
     * PostgreSQL DISTINCT + ORDER BY RANDOM() incompatibility.
     */
    @Query("SELECT DISTINCT q FROM Question q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE q.deleted = false AND q.isActive = true AND q.topic = :topic")
    List<Question> findRandomByTopicWithOptions(@Param("topic") Topic topic, Pageable pageable);

    /**
     * Find questions from all topics WITH options eagerly loaded.
     * Use this for marathon mode to avoid LazyInitializationException.
     * Note: Shuffling is done in Java (selectAndShuffleQuestions) to avoid
     * PostgreSQL DISTINCT + ORDER BY RANDOM() incompatibility.
     */
    @Query("SELECT DISTINCT q FROM Question q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE q.deleted = false AND q.isActive = true")
    List<Question> findRandomQuestionsWithOptions(Pageable pageable);

    /**
     * Find questions by IDs WITH options eagerly loaded.
     * Use this for batch loading questions with their options.
     */
    @Query("SELECT DISTINCT q FROM Question q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE q.id IN :ids AND q.deleted = false AND q.isActive = true")
    List<Question> findByIdsWithOptions(@Param("ids") List<Long> ids);

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id")
    Optional<Question> findByIdWithOptions(@Param("id") Long id);}