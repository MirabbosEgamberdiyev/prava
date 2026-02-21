package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.Set;

/**
 * Topic Entity with full multi-language support
 * Manages question topics with translations
 */
@Entity
@Table(name = "topics",
        uniqueConstraints = @UniqueConstraint(columnNames = "code"),
        indexes = {
                @Index(name = "idx_topic_code", columnList = "code"),
                @Index(name = "idx_topic_active", columnList = "is_active")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Topic extends BaseEntity {

    /**
     * Unique code for topic (e.g., "traffic_rules", "road_signs")
     * Used as identifier in system
     */
    @Column(nullable = false, unique = true, length = 100)
    private String code;

    // Multi-language names
    @Column(name = "name_uzl", nullable = false, length = 200)
    private String nameUzl;

    @Column(name = "name_uzc", length = 200)
    private String nameUzc;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(name = "name_ru", length = 200)
    private String nameRu;

    // Multi-language descriptions
    @Column(name = "description_uzl", columnDefinition = "TEXT")
    private String descriptionUzl;

    @Column(name = "description_uzc", columnDefinition = "TEXT")
    private String descriptionUzc;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "description_ru", columnDefinition = "TEXT")
    private String descriptionRu;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Statistics
    @Builder.Default
    @Column(name = "question_count")
    private Long questionCount = 0L;

    // Relationships
    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL)
    private Set<Question> questions;

    /**
     * Get localized name based on language
     */
    public String getName(AcceptLanguage language) {
        return switch (language) {
            case UZL -> nameUzl;
            case UZC -> nameUzc != null ? nameUzc : nameUzl;
            case EN -> nameEn != null ? nameEn : nameUzl;
            case RU -> nameRu != null ? nameRu : nameUzl;
        };
    }

    /**
     * Get localized description based on language
     */
    public String getDescription(AcceptLanguage language) {
        return switch (language) {
            case UZL -> descriptionUzl;
            case UZC -> descriptionUzc != null ? descriptionUzc : descriptionUzl;
            case EN -> descriptionEn != null ? descriptionEn : descriptionUzl;
            case RU -> descriptionRu != null ? descriptionRu : descriptionUzl;
        };
    }

    /**
     * Increment question count
     */
    public void incrementQuestionCount() {
        this.questionCount++;
    }

    /**
     * Decrement question count
     */
    public void decrementQuestionCount() {
        if (this.questionCount > 0) {
            this.questionCount--;
        }
    }
}