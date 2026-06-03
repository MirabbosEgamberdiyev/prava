package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.LearningCenterAgreement;

import java.time.LocalDate;

@Repository
public interface LearningCenterAgreementRepository
        extends JpaRepository<LearningCenterAgreement, Long> {

    @Query("""
        SELECT a FROM LearningCenterAgreement a
        WHERE a.deleted = false
          AND (:centerId IS NULL OR a.learningCenter.id = :centerId)
        ORDER BY a.createdAt DESC
        """)
    Page<LearningCenterAgreement> findActive(Long centerId, Pageable pageable);

    @Query("""
        SELECT a FROM LearningCenterAgreement a
        WHERE a.deleted = false
          AND a.status = 'ACTIVE'
          AND a.endDate BETWEEN :from AND :to
        ORDER BY a.endDate ASC
        """)
    Page<LearningCenterAgreement> findExpiringBetween(LocalDate from, LocalDate to, Pageable pageable);
}
