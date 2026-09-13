package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_admin_id", columnList = "admin_id"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_entity", columnList = "entity_name"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "admin_username", length = 150)
    private String adminUsername;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // CREATE, UPDATE, DELETE, STATUS_CHANGE, RESET_PASSWORD, FORCE_LOGOUT, EXPORT, IMPORT

    @Column(name = "entity_name", length = 100)
    private String entityName; // User, Question, Topic, Package, Ticket, AppRelease, Agreement, etc.

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "client_ip", length = 100)
    private String clientIp;
}
