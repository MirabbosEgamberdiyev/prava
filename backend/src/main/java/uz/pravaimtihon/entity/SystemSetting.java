package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings", indexes = {
        @Index(name = "idx_setting_key", columnList = "setting_key", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting extends BaseEntity {

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String settingValue;

    @Column(name = "description", length = 255)
    private String description;
}
