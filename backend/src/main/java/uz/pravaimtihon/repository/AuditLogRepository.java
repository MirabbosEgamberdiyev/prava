package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.AuditLog;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(:entityName IS NULL OR a.entityName = :entityName)")
    Page<AuditLog> findLogsNoAdmin(
            @Param("action") String action,
            @Param("entityName") String entityName,
            Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(LOWER(a.adminUsername) LIKE :pattern) AND " +
            "(:entityName IS NULL OR a.entityName = :entityName)")
    Page<AuditLog> searchLogsWithPattern(
            @Param("action") String action,
            @Param("pattern") String pattern,
            @Param("entityName") String entityName,
            Pageable pageable);

    default Page<AuditLog> searchLogs(
            String action,
            String adminUsername,
            String entityName,
            Pageable pageable) {
        if (adminUsername == null || adminUsername.isBlank()) {
            return findLogsNoAdmin(action, entityName, pageable);
        }
        return searchLogsWithPattern(action, "%" + adminUsername.toLowerCase().trim() + "%", entityName, pageable);
    }
}
