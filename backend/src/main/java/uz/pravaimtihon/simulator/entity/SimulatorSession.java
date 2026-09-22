package uz.pravaimtihon.simulator.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.simulator.enums.SimulatorMode;
import uz.pravaimtihon.simulator.enums.SimulatorSessionStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "simulator_sessions", indexes = {
        @Index(name = "idx_sim_sessions_user", columnList = "user_id"),
        @Index(name = "idx_sim_sessions_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatorSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "refreshTokens", "examSessions"})
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SimulatorMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private SimulatorSessionStatus status = SimulatorSessionStatus.CREATED;

    @Column(name = "total_penalty_points", nullable = false)
    @Builder.Default
    private Integer totalPenaltyPoints = 0;

    @Column(name = "is_passed", nullable = false)
    @Builder.Default
    private Boolean isPassed = false;

    @Column(name = "time_spent_seconds", nullable = false)
    @Builder.Default
    private Integer timeSpentSeconds = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "vehicle_model", length = 100)
    @Builder.Default
    private String vehicleModel = "Chevrolet Cobalt";

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SimulatorExerciseResult> exerciseResults = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SimulatorPenaltyEvent> penaltyEvents = new ArrayList<>();
}
