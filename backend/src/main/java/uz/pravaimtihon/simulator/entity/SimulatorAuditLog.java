package uz.pravaimtihon.simulator.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;

@Entity
@Table(name = "simulator_audit_logs", indexes = {
        @Index(name = "idx_sim_audit_action", columnList = "action_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatorAuditLog extends BaseEntity {

    @Column(name = "action_type", nullable = false, length = 64)
    private String actionType;

    @Column(name = "target_entity", nullable = false, length = 64)
    private String targetEntity;

    @Column(name = "target_id", length = 64)
    private String targetId;

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @Column(columnDefinition = "TEXT")
    private String details;
}
