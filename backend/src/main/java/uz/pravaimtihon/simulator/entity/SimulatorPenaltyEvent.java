package uz.pravaimtihon.simulator.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;

@Entity
@Table(name = "simulator_penalty_events", indexes = {
        @Index(name = "idx_sim_penalties_session", columnList = "session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatorPenaltyEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private SimulatorSession session;

    @Column(name = "exercise_number", nullable = false)
    private Integer exerciseNumber;

    @Column(name = "rule_code", nullable = false, length = 64)
    private String ruleCode;

    @Column(name = "points", nullable = false)
    private Integer points;

    @Column(name = "pos_x")
    private Double posX;

    @Column(name = "pos_y")
    private Double posY;

    @Column(name = "occurred_at_seconds", nullable = false)
    @Builder.Default
    private Integer occurredAtSeconds = 0;
}
