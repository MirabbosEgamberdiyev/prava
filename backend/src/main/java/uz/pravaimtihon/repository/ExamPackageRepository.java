package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.Topic;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ExamPackageRepository extends JpaRepository<ExamPackage, Long> {

    // ============================================
    // Basic Queries
    // ============================================

    Page<ExamPackage> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    Page<ExamPackage> findByDeletedFalse(Pageable pageable);

    Page<ExamPackage> findByTopicAndDeletedFalseAndIsActiveTrue(Topic topic, Pageable pageable);

    Page<ExamPackage> findByIsFreeAndDeletedFalseAndIsActiveTrue(Boolean isFree, Pageable pageable);

    @Query("SELECT p FROM ExamPackage p WHERE p.id = :id AND p.deleted = false")
    Optional<ExamPackage> findById(@Param("id") Long id);

    // ============================================
    // ✅ FIXED: Duplicate Check - 4 Languages
    // ============================================

    /**
     * ✅ Check if ANY language name exists (for CREATE)
     */
    @Query("SELECT COUNT(p) > 0 FROM ExamPackage p WHERE p.deleted = false AND (" +
            "LOWER(TRIM(p.nameUzl)) = LOWER(TRIM(:nameUzl)) OR " +
            "LOWER(TRIM(p.nameUzc)) = LOWER(TRIM(:nameUzc)) OR " +
            "LOWER(TRIM(p.nameEn)) = LOWER(TRIM(:nameEn)) OR " +
            "LOWER(TRIM(p.nameRu)) = LOWER(TRIM(:nameRu)))")
    boolean existsByAnyName(
            @Param("nameUzl") String nameUzl,
            @Param("nameUzc") String nameUzc,
            @Param("nameEn") String nameEn,
            @Param("nameRu") String nameRu
    );

    /**
     * ✅ Check if ANY language name exists excluding specific ID (for UPDATE)
     */
    @Query("SELECT COUNT(p) > 0 FROM ExamPackage p " +
            "WHERE p.id != :id AND p.deleted = false AND (" +
            "LOWER(TRIM(p.nameUzl)) = LOWER(TRIM(:nameUzl)) OR " +
            "LOWER(TRIM(p.nameUzc)) = LOWER(TRIM(:nameUzc)) OR " +
            "LOWER(TRIM(p.nameEn)) = LOWER(TRIM(:nameEn)) OR " +
            "LOWER(TRIM(p.nameRu)) = LOWER(TRIM(:nameRu)))")
    boolean existsByAnyNameExcludingId(
            @Param("nameUzl") String nameUzl,
            @Param("nameUzc") String nameUzc,
            @Param("nameEn") String nameEn,
            @Param("nameRu") String nameRu,
            @Param("id") Long id
    );

    /**
     * ✅ Find package by name (any language)
     */
    @Query("SELECT p FROM ExamPackage p WHERE p.deleted = false AND " +
            "(LOWER(TRIM(p.nameUzl)) = LOWER(TRIM(:name)) OR " +
            "LOWER(TRIM(p.nameUzc)) = LOWER(TRIM(:name)) OR " +
            "LOWER(TRIM(p.nameEn)) = LOWER(TRIM(:name)) OR " +
            "LOWER(TRIM(p.nameRu)) = LOWER(TRIM(:name)))")
    Optional<ExamPackage> findByName(@Param("name") String name);

    // ============================================
    // ✅ NEW: Question Overlap Queries
    // ============================================

    /**
     * ✅ Get ALL question IDs used across all active packages
     * Used to minimize question duplication
     */
    @Query("SELECT DISTINCT q.id FROM ExamPackage p " +
            "JOIN p.questions q " +
            "WHERE p.deleted = false AND p.isActive = true")
    Set<Long> findAllUsedQuestionIds();

    /**
     * ✅ Get question IDs used in a specific package
     */
    @Query("SELECT q.id FROM ExamPackage p " +
            "JOIN p.questions q " +
            "WHERE p.id = :packageId AND p.deleted = false")
    Set<Long> findQuestionIdsByPackageId(@Param("packageId") Long packageId);

    /**
     * ✅ Find packages that share questions with given question IDs
     */
    @Query("SELECT DISTINCT p FROM ExamPackage p " +
            "JOIN p.questions q " +
            "WHERE q.id IN :questionIds AND p.deleted = false AND p.isActive = true")
    List<ExamPackage> findPackagesUsingQuestions(@Param("questionIds") Set<Long> questionIds);

    /**
     * ✅ Count how many packages use a specific question
     */
    @Query("SELECT COUNT(DISTINCT p) FROM ExamPackage p " +
            "JOIN p.questions q " +
            "WHERE q.id = :questionId AND p.deleted = false AND p.isActive = true")
    long countPackagesUsingQuestion(@Param("questionId") Long questionId);

    /**
     * ✅ OPTIMIZED: Batch query to count packages using multiple questions
     * Returns List of [questionId, count] pairs
     * Replaces N+1 queries with single GROUP BY query
     */
    @Query("SELECT q.id, COUNT(DISTINCT p.id) FROM ExamPackage p " +
            "JOIN p.questions q " +
            "WHERE q.id IN :questionIds AND p.deleted = false AND p.isActive = true " +
            "GROUP BY q.id")
    List<Object[]> countPackagesUsingQuestionsBatch(@Param("questionIds") Set<Long> questionIds);

    /**
     * ✅ Get overlap statistics between two packages
     */
    @Query("SELECT COUNT(DISTINCT q.id) FROM ExamPackage p1 " +
            "JOIN p1.questions q " +
            "JOIN ExamPackage p2 ON p2.id = :package2Id " +
            "WHERE p1.id = :package1Id " +
            "AND q MEMBER OF p2.questions " +
            "AND p1.deleted = false AND p2.deleted = false")
    long countOverlappingQuestions(
            @Param("package1Id") Long package1Id,
            @Param("package2Id") Long package2Id
    );

    // ============================================
    // Fetch Queries (with relationships)
    // ============================================

    @Query("SELECT p FROM ExamPackage p LEFT JOIN FETCH p.questions " +
            "WHERE p.id = :id AND p.deleted = false")
    ExamPackage findByIdWithQuestions(@Param("id") Long id);

    @Query("SELECT p FROM ExamPackage p LEFT JOIN FETCH p.topic " +
            "WHERE p.id = :id AND p.deleted = false")
    Optional<ExamPackage> findByIdWithTopic(@Param("id") Long id);

    /**
     * ✅ Fetch package with questions AND options in ONE query (N+1 fix)
     */
    @Query("SELECT DISTINCT p FROM ExamPackage p " +
            "LEFT JOIN FETCH p.questions q " +
            "LEFT JOIN FETCH q.options o " +
            "LEFT JOIN FETCH q.topic " +
            "WHERE p.id = :id " +
            "AND p.deleted = false " +
            "AND p.isActive = true " +
            "AND q.deleted = false " +
            "AND q.isActive = true")
    ExamPackage findByIdWithQuestionsAndOptions(@Param("id") Long id);

    // ============================================
    // Count Queries
    // ============================================

    @Query("SELECT COUNT(p) FROM ExamPackage p WHERE p.deleted = false AND p.isActive = true")
    long countActivePackages();

    @Query("SELECT COUNT(p) FROM ExamPackage p " +
            "WHERE p.topic.code = :topicCode AND p.isActive = true AND p.deleted = false")
    long countActivePackagesByTopicCode(@Param("topicCode") String topicCode);

    @Query("SELECT COALESCE(SUM(SIZE(p.questions)), 0) FROM ExamPackage p " +
            "WHERE p.topic.code = :topicCode AND p.isActive = true AND p.deleted = false")
    long countTotalQuestionsByTopicCode(@Param("topicCode") String topicCode);

    // ============================================
    // Statistics Queries
    // ============================================

    @Query("SELECT DISTINCT p.topic.code FROM ExamPackage p " +
            "WHERE p.topic IS NOT NULL AND p.isActive = true AND p.deleted = false " +
            "ORDER BY p.topic.code")
    List<String> findAllDistinctActiveTopicCodes();

    @Query("SELECT p FROM ExamPackage p WHERE SIZE(p.questions) < p.questionCount " +
            "AND p.deleted = false AND p.isActive = true")
    List<ExamPackage> findPackagesWithInsufficientQuestions();

    @Query("SELECT AVG(p.passingScore) FROM ExamPackage p " +
            "WHERE p.deleted = false AND p.isActive = true")
    Double getAveragePassingScore();

    @Query("SELECT AVG(p.durationMinutes) FROM ExamPackage p " +
            "WHERE p.deleted = false AND p.isActive = true")
    Double getAverageDuration();

    /**
     * ✅ NEW: Get average question reuse across packages
     */
    @Query("SELECT AVG(reuse.count) FROM " +
            "(SELECT COUNT(p.id) as count FROM ExamPackage p " +
            "JOIN p.questions q " +
            "WHERE p.deleted = false AND p.isActive = true " +
            "GROUP BY q.id) as reuse")
    Double getAverageQuestionReuseRate();

    // ============================================
    // Search Queries
    // ============================================

    @Query("SELECT p FROM ExamPackage p WHERE p.deleted = false AND " +
            "(LOWER(p.nameUzl) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.nameUzc) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.nameRu) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ExamPackage> searchByName(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM ExamPackage p WHERE p.deleted = false AND p.isActive = true AND " +
            "p.isFree = false AND p.price BETWEEN :minPrice AND :maxPrice")
    List<ExamPackage> findByPriceRange(
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice
    );
}