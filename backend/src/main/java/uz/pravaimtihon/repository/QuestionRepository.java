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

    // ══════════════════════════════════════════════════════════════════════
    // ⚠️ AUDIT — PERFORMANCE (kritik):
    //
    // Quyidagi `findRandomByTopicWithOptions` / `findRandomQuestionsWithOptions`
    // metodlari `LEFT JOIN FETCH` (kolleksiya) va `Pageable` ni BIRGA ishlatadi.
    // Hibernate bunday holatda LIMIT'ni SQL'ga qo'sha olmaydi va ogohlantirish
    // beradi: "HHH90003004: firstResult/maxResults specified with collection
    // fetch; applying in memory". Ya'ni u BUTUN savollar jadvalini (savol bankida
    // minglab yozuv) barcha variantlari bilan JVM xotirasiga yuklab, sahifalashni
    // Java tomonda bajaradi.
    //
    // Bu har bir `/api/v1/public/guest-exam` (AUTENTIFIKATSIYASIZ!) va har bir
    // marafon boshlashda sodir bo'lardi — arzon OutOfMemory / DoS vektori.
    //
    // Yechim: ikki bosqichli o'qish —
    //   1) `findRandomQuestionIds(...)` — kolleksiya fetch YO'Q, shuning uchun
    //      LIMIT to'g'ridan-to'g'ri SQL'da bajariladi (DB tomonda random + limit);
    //   2) `findByIdsWithOptions(ids)` — faqat tanlangan N ta savol uchun
    //      variantlarni bitta so'rovda yuklaydi (N+1 ham yo'q).
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tasodifiy N ta faol savol ID'sini qaytaradi (DB tomonda LIMIT bilan).
     * Kolleksiya fetch yo'q — sahifalash SQL darajasida ishlaydi.
     */
    @Query("SELECT q.id FROM Question q " +
            "WHERE q.deleted = false AND q.isActive = true " +
            "ORDER BY FUNCTION('RANDOM')")
    List<Long> findRandomQuestionIds(Pageable pageable);

    /**
     * Mavzu bo'yicha tasodifiy N ta faol savol ID'si (DB tomonda LIMIT bilan).
     */
    @Query("SELECT q.id FROM Question q " +
            "WHERE q.deleted = false AND q.isActive = true AND q.topic = :topic " +
            "ORDER BY FUNCTION('RANDOM')")
    List<Long> findRandomQuestionIdsByTopic(@Param("topic") Topic topic, Pageable pageable);

    /**
     * @deprecated Kolleksiya fetch + Pageable = xotirada sahifalash.
     *             O'rniga {@link #findRandomQuestionIdsByTopic} +
     *             {@link #findByIdsWithOptions} ishlating.
     */
    @Deprecated
    @Query("SELECT DISTINCT q FROM Question q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE q.deleted = false AND q.isActive = true AND q.topic = :topic")
    List<Question> findRandomByTopicWithOptions(@Param("topic") Topic topic, Pageable pageable);

    /**
     * @deprecated Kolleksiya fetch + Pageable = xotirada sahifalash
     *             (butun jadval yuklanadi). O'rniga
     *             {@link #findRandomQuestionIds} + {@link #findByIdsWithOptions}.
     */
    @Deprecated
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

    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.options WHERE q.id = :id AND q.deleted = false")
    Optional<Question> findByIdWithOptions(@Param("id") Long id);}