package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.PackageGenerationType;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "exam_packages", indexes = {
        @Index(name = "idx_package_active", columnList = "is_active"),
        @Index(name = "idx_package_type", columnList = "generation_type"),
        @Index(name = "idx_package_topic", columnList = "topic_id"),
        @Index(name = "idx_package_deleted_active", columnList = "deleted, is_active"),
        @Index(name = "idx_package_topic_active_deleted", columnList = "topic_id, is_active, deleted"),
        @Index(name = "idx_package_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamPackage extends BaseEntity {

    @Column(name = "name_uzl", nullable = false, length = 200)
    private String nameUzl;

    @Column(name = "name_uzc", length = 200)
    private String nameUzc;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(name = "name_ru", length = 200)
    private String nameRu;

    @Column(name = "description_uzl", length = 5000)
    private String descriptionUzl;

    @Column(name = "description_uzc", length = 5000)
    private String descriptionUzc;

    @Column(name = "description_en", length = 5000)
    private String descriptionEn;

    @Column(name = "description_ru", length = 5000)
    private String descriptionRu;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "passing_score", nullable = false)
    private Integer passingScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "generation_type", nullable = false)
    private PackageGenerationType generationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = true)
    private Topic topic;

    @Column(name = "is_free", nullable = false)
    @Builder.Default
    private Boolean isFree = false;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "package_questions",
            joinColumns = @JoinColumn(name = "package_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    @Builder.Default
    private Set<Question> questions = new HashSet<>();

    // ============================================
    // ✅ FIXED: Multi-language Support Methods
    // ============================================

    /**
     * Get package name based on language with fallback
     */
    public String getName(AcceptLanguage language) {
        if (language == null) {
            return nameUzl;
        }

        return switch (language) {
            case UZL -> nameUzl != null ? nameUzl : nameEn;
            case UZC -> nameUzc != null ? nameUzc : nameUzl;
            case EN -> nameEn != null ? nameEn : nameUzl;
            case RU -> nameRu != null ? nameRu : nameUzl;
        };
    }

    /**
     * Get package description based on language with fallback
     */
    public String getDescription(AcceptLanguage language) {
        if (language == null) {
            return descriptionUzl;
        }

        return switch (language) {
            case UZL -> descriptionUzl != null ? descriptionUzl : descriptionEn;
            case UZC -> descriptionUzc != null ? descriptionUzc : descriptionUzl;
            case EN -> descriptionEn != null ? descriptionEn : descriptionUzl;
            case RU -> descriptionRu != null ? descriptionRu : descriptionUzl;
        };
    }

    /**
     * Get topic code (null-safe)
     */
    public String getTopicCode() {
        return topic != null ? topic.getCode() : null;
    }

    /**
     * Get topic name based on language (null-safe)
     */
    public String getTopicName(AcceptLanguage language) {
        if (topic == null) {
            return null;
        }
        return topic.getName(language);
    }

    /**
     * Get actual question count
     */
    public Integer getActualQuestionCount() {
        return questions != null ? questions.size() : 0;
    }

    /**
     * Check if package has enough questions
     */
    public boolean hasEnoughQuestions() {
        return questions != null && questions.size() >= questionCount;
    }

    // ============================================
    // Business Logic Methods
    // ============================================

    /**
     * Check if package is available for users
     */
    public boolean isAvailable() {
        return isActive && !getDeleted() && hasEnoughQuestions();
    }

    /**
     * Get topic ID (null-safe)
     */
    public Long getTopicId() {
        return topic != null ? topic.getId() : null;
    }
}