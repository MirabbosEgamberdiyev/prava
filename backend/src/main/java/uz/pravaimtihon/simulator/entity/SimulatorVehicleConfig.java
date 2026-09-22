package uz.pravaimtihon.simulator.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.entity.BaseEntity;

@Entity
@Table(name = "simulator_vehicle_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatorVehicleConfig extends BaseEntity {

    @Column(name = "model_name", nullable = false, unique = true, length = 100)
    private String modelName;

    @Column(name = "mass_kg", nullable = false)
    @Builder.Default
    private Double massKg = 1250.0;

    @Column(name = "max_speed_kmh", nullable = false)
    @Builder.Default
    private Double maxSpeedKmh = 45.0;

    @Column(name = "acceleration_power", nullable = false)
    @Builder.Default
    private Double accelerationPower = 0.35;

    @Column(name = "braking_power", nullable = false)
    @Builder.Default
    private Double brakingPower = 0.55;

    @Column(name = "steering_angle_max", nullable = false)
    @Builder.Default
    private Double steeringAngleMax = 35.0;

    @Column(name = "wheelbase_meters", nullable = false)
    @Builder.Default
    private Double wheelbaseMeters = 2.62;

    @Column(name = "track_width_meters", nullable = false)
    @Builder.Default
    private Double trackWidthMeters = 1.73;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;
}
