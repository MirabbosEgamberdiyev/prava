package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.PartnerLead;
import uz.pravaimtihon.enums.PartnerLeadStatus;

import java.time.LocalDateTime;

@Repository
public interface PartnerLeadRepository extends JpaRepository<PartnerLead, Long> {

    Page<PartnerLead> findByStatus(PartnerLeadStatus status, Pageable pageable);

    @Query("SELECT p FROM PartnerLead p WHERE " +
            "(:status IS NULL OR p.status = :status)")
    Page<PartnerLead> findByStatusOnly(
            @Param("status") PartnerLeadStatus status,
            Pageable pageable);

    @Query("SELECT p FROM PartnerLead p WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(LOWER(p.companyName) LIKE :pattern OR " +
            " LOWER(p.contactPerson) LIKE :pattern OR " +
            " LOWER(p.phone) LIKE :pattern OR " +
            " LOWER(p.email) LIKE :pattern OR " +
            " LOWER(p.region) LIKE :pattern)")
    Page<PartnerLead> searchLeadsWithPattern(
            @Param("status") PartnerLeadStatus status,
            @Param("pattern") String pattern,
            Pageable pageable);

    default Page<PartnerLead> searchLeads(
            PartnerLeadStatus status,
            String search,
            Pageable pageable) {
        if (search == null || search.isBlank()) {
            return findByStatusOnly(status, pageable);
        }
        return searchLeadsWithPattern(status, "%" + search.toLowerCase().trim() + "%", pageable);
    }

    long countByStatus(PartnerLeadStatus status);

    long countByCreatedAtAfter(LocalDateTime date);
}
