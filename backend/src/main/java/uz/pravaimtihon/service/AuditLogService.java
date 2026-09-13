package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.AuditLog;
import uz.pravaimtihon.repository.AuditLogRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(Long adminId, String adminUsername, String action, String entityName, String entityId, String details, String clientIp) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .adminId(adminId)
                    .adminUsername(adminUsername != null ? adminUsername : "admin")
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .details(details)
                    .clientIp(clientIp != null ? clientIp : "127.0.0.1")
                    .build();
            auditLogRepository.save(auditLog);
            log.debug("Audit logged: user={}, action={}, entity={}/{}", adminUsername, action, entityName, entityId);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getLogs(Pageable pageable, String action, String adminUsername, String entityName) {
        return auditLogRepository.searchLogs(action, adminUsername, entityName, pageable);
    }
}
