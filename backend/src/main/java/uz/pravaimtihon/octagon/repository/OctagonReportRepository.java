package uz.pravaimtihon.octagon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.octagon.entity.OctagonReport;

import java.util.List;
import java.util.UUID;

@Repository
public interface OctagonReportRepository extends JpaRepository<OctagonReport, UUID> {
    List<OctagonReport> findByReportedUserIdOrderByCreatedAtDesc(String reportedUserId);
}
