package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.Ticket;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // ============================================
    // Basic queries
    // ============================================

    Page<Ticket> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    Page<Ticket> findByTopicIdAndDeletedFalseAndIsActiveTrue(Long topicId, Pageable pageable);

    Page<Ticket> findByExamPackageIdAndDeletedFalseAndIsActiveTrue(Long packageId, Pageable pageable);

    Optional<Ticket> findByIdAndDeletedFalse(Long id);

    // ============================================
    // With Questions (JOIN FETCH)
    // ============================================

    @Query("SELECT DISTINCT t FROM Ticket t " +
            "LEFT JOIN FETCH t.questions q " +
            "LEFT JOIN FETCH q.options " +
            "WHERE t.id = :id AND t.deleted = false")
    Optional<Ticket> findByIdWithQuestionsAndOptions(@Param("id") Long id);

    @Query("SELECT DISTINCT t FROM Ticket t " +
            "LEFT JOIN FETCH t.questions " +
            "WHERE t.id = :id AND t.deleted = false AND t.isActive = true")
    Optional<Ticket> findByIdWithQuestions(@Param("id") Long id);

    // ============================================
    // By Package
    // ============================================

    @Query("SELECT t FROM Ticket t " +
            "WHERE t.examPackage.id = :packageId " +
            "AND t.deleted = false AND t.isActive = true " +
            "ORDER BY t.ticketNumber ASC")
    List<Ticket> findByPackageIdOrderByTicketNumber(@Param("packageId") Long packageId);

    long countByExamPackageIdAndDeletedFalseAndIsActiveTrue(Long packageId);

    // ============================================
    // By Topic
    // ============================================

    @Query("SELECT t FROM Ticket t " +
            "WHERE t.topic.id = :topicId " +
            "AND t.deleted = false AND t.isActive = true " +
            "ORDER BY t.ticketNumber ASC")
    List<Ticket> findByTopicIdOrderByTicketNumber(@Param("topicId") Long topicId);

    long countByTopicIdAndDeletedFalseAndIsActiveTrue(Long topicId);

    // ============================================
    // Ticket Number management
    // ============================================

    @Query("SELECT COALESCE(MAX(t.ticketNumber), 0) FROM Ticket t " +
            "WHERE t.examPackage.id = :packageId AND t.deleted = false")
    int findMaxTicketNumberByPackageId(@Param("packageId") Long packageId);

    @Query("SELECT COALESCE(MAX(t.ticketNumber), 0) FROM Ticket t " +
            "WHERE t.topic.id = :topicId AND t.deleted = false")
    int findMaxTicketNumberByTopicId(@Param("topicId") Long topicId);

    boolean existsByTicketNumberAndExamPackageIdAndDeletedFalse(Integer ticketNumber, Long packageId);

    boolean existsByTicketNumberAndTopicIdAndDeletedFalse(Integer ticketNumber, Long topicId);

    Optional<Ticket> findByTicketNumberAndExamPackageIdAndDeletedFalse(Integer ticketNumber, Long packageId);

    Optional<Ticket> findByTicketNumberAndTopicIdAndDeletedFalse(Integer ticketNumber, Long topicId);

    // ============================================
    // Search
    // ============================================

    @Query("SELECT t FROM Ticket t WHERE t.deleted = false AND t.isActive = true AND " +
            "(LOWER(t.nameUzl) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.nameUzc) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.nameRu) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Ticket> searchByName(@Param("search") String search, Pageable pageable);

    // ============================================
    // Global ticket number
    // ============================================

    @Query("SELECT COALESCE(MAX(t.ticketNumber), 0) FROM Ticket t WHERE t.deleted = false")
    int findMaxTicketNumberGlobal();

    // ============================================
    // Statistics
    // ============================================

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.deleted = false AND t.isActive = true")
    long countActiveTickets();

}
