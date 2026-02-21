package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.Topic;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Topic entity
 */
public interface TopicRepository extends JpaRepository<Topic, Long> {

    /**
     * Find topic by code (unique identifier)
     */
    Optional<Topic> findByCodeAndDeletedFalse(String code);

    /**
     * Find topic by code (for testing/cleanup)
     */
    Optional<Topic> findByCode(String code);

    /**
     * Check if topic code exists
     */
    boolean existsByCodeAndDeletedFalse(String code);

    /**
     * Check if topic code exists excluding specific ID (for update)
     */
    @Query("SELECT COUNT(t) > 0 FROM Topic t WHERE t.code = :code AND t.id != :id AND t.deleted = false")
    boolean existsByCodeAndIdNotAndDeletedFalse(@Param("code") String code, @Param("id") Long id);

    /**
     * Get all active topics ordered by displayOrder
     */
    @Query("SELECT t FROM Topic t WHERE t.deleted = false AND t.isActive = true ORDER BY t.displayOrder, t.nameUzl")
    List<Topic> findAllActiveOrderByDisplayOrder();

    /**
     * Get all topics with pagination
     */
    Page<Topic> findByDeletedFalse(Pageable pageable);

    /**
     * Get active topics with pagination
     */
    Page<Topic> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    /**
     * Search topics by name in all languages
     */
    @Query("SELECT t FROM Topic t WHERE t.deleted = false AND " +
            "(LOWER(t.nameUzl) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.nameUzc) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.nameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.nameRu) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.code) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Topic> searchTopics(@Param("query") String query, Pageable pageable);

    /**
     * Get topics with question count greater than zero
     */
    @Query("SELECT t FROM Topic t WHERE t.deleted = false AND t.isActive = true AND t.questionCount > 0 " +
            "ORDER BY t.displayOrder, t.nameUzl")
    List<Topic> findTopicsWithQuestions();

    /**
     * Count active topics
     */
    long countByDeletedFalseAndIsActiveTrue();
}