package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.entity.AuditLog;
import uz.pravaimtihon.service.AuditLogService;

@RestController
@RequestMapping({"/api/v1/admin/audit-logs", "/api/v1/admin/audit"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Admin Audit Logs", description = "Admin harakatlari jurnali (faqat SUPER_ADMIN)")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "Admin harakatlari jurnalini olish")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String adminUsername,
            @RequestParam(required = false) String entityName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<AuditLog> logs = auditLogService.getLogs(pageable, action, adminUsername, entityName);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
