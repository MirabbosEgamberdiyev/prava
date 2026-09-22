package uz.pravaimtihon.simulator.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;

@Entity
@Table(name = "simulator_exercise_results", indexes = {
        @Index(name = "idx_sim_ex_results_session", columnList = "session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatorExerciseResult extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private SimulatorSession session;

    @Column(name = "exercise_number", nullable = false)
    private Integer exerciseNumber;

    @Column(name = "is_passed", nullable = false)
    @Builder.Default
    private Boolean isPassed = false;

    @Column(name = "penalty_points", nullable = false)
    @Builder.Default
    private Integer penaltyPoints = 0;

    @Column(name = "time_spent_seconds", nullable = false)
    @Builder.Default
    private Integer timeSpentSeconds = 0;
}
