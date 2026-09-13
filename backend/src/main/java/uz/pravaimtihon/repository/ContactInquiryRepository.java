package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.ContactInquiry;
import uz.pravaimtihon.enums.InquiryStatus;
import uz.pravaimtihon.enums.InquiryType;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ContactInquiryRepository extends JpaRepository<ContactInquiry, Long> {

    Optional<ContactInquiry> findByTicketId(String ticketId);

    Page<ContactInquiry> findByStatus(InquiryStatus status, Pageable pageable);

    Page<ContactInquiry> findByInquiryType(InquiryType inquiryType, Pageable pageable);

    @Query("SELECT c FROM ContactInquiry c WHERE " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:inquiryType IS NULL OR c.inquiryType = :inquiryType)")
    Page<ContactInquiry> findInquiriesNoSearch(
            @Param("status") InquiryStatus status,
            @Param("inquiryType") InquiryType inquiryType,
            Pageable pageable);

    @Query("SELECT c FROM ContactInquiry c WHERE " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:inquiryType IS NULL OR c.inquiryType = :inquiryType) AND " +
            "(LOWER(c.fullName) LIKE :pattern OR " +
            " LOWER(c.organization) LIKE :pattern OR " +
            " LOWER(c.phone) LIKE :pattern OR " +
            " LOWER(c.ticketId) LIKE :pattern)")
    Page<ContactInquiry> searchInquiriesWithPattern(
            @Param("status") InquiryStatus status,
            @Param("inquiryType") InquiryType inquiryType,
            @Param("pattern") String pattern,
            Pageable pageable);

    default Page<ContactInquiry> searchInquiries(
            InquiryStatus status,
            InquiryType inquiryType,
            String search,
            Pageable pageable) {
        if (search == null || search.isBlank()) {
            return findInquiriesNoSearch(status, inquiryType, pageable);
        }
        return searchInquiriesWithPattern(status, inquiryType, "%" + search.toLowerCase().trim() + "%", pageable);
    }

    long countByStatus(InquiryStatus status);

    long countByCreatedAtAfter(LocalDateTime date);
}
