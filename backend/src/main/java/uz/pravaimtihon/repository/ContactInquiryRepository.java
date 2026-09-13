package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.ContactInquiry;

import java.util.Optional;

@Repository
public interface ContactInquiryRepository extends JpaRepository<ContactInquiry, Long> {

    Optional<ContactInquiry> findByTicketId(String ticketId);
}
