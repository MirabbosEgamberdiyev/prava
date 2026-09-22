package uz.pravaimtihon.simulator.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;

@Entity
@Table(name = "simulator_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatorExerciseConfig extends BaseEntity {

    @Column(name = "exercise_number", nullable = false, unique = true)
    private Integer exerciseNumber;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "title_uzl", nullable = false)
    private String titleUzl;

    @Column(name = "title_uzc", nullable = false)
    private String titleUzc;

    @Column(name = "title_ru", nullable = false)
    private String titleRu;

    @Column(name = "description_uzl", columnDefinition = "TEXT")
    private String descriptionUzl;

    @Column(name = "description_uzc", columnDefinition = "TEXT")
    private String descriptionUzc;

    @Column(name = "description_ru", columnDefinition = "TEXT")
    private String descriptionRu;

    @Column(name = "time_limit_seconds", nullable = false)
    @Builder.Default
    private Integer timeLimitSeconds = 60;

    @Column(name = "max_speed_kmh", nullable = false)
    @Builder.Default
    private Integer maxSpeedKmh = 40;

    @Column(name = "max_penalty_allowed", nullable = false)
    @Builder.Default
    private Integer maxPenaltyAllowed = 20;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
