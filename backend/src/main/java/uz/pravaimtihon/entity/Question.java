package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.QuestionDifficulty;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Question entity with complete multi-language support
 * Now uses Topic entity for proper topic management
 */
@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_question_topic", columnList = "topic_id"),
        @Index(name = "idx_question_difficulty", columnList = "difficulty"),
        @Index(name = "idx_question_deleted", columnList = "deleted"),
        @Index(name = "idx_question_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question extends BaseEntity {

    // Multi-language text fields
    @Column(name = "text_uzl", columnDefinition = "TEXT")
    private String textUzl;

    @Column(name = "text_uzc", columnDefinition = "TEXT")
    private String textUzc;

    @Column(name = "text_en", columnDefinition = "TEXT")
    private String textEn;

    @Column(name = "text_ru", columnDefinition = "TEXT")
    private String textRu;

    // Multi-language explanations
    @Column(name = "explanation_uzl", columnDefinition = "TEXT")
    private String explanationUzl;

    @Column(name = "explanation_uzc", columnDefinition = "TEXT")
    private String explanationUzc;

    @Column(name = "explanation_en", columnDefinition = "TEXT")
    private String explanationEn;

    @Column(name = "explanation_ru", columnDefinition = "TEXT")
    private String explanationRu;

    /**
     * Changed from String to Topic entity relationship
     * Provides proper multi-language support for topics
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = true)
    private Topic topic;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private QuestionDifficulty difficulty = QuestionDifficulty.MEDIUM;

    @Column(name = "correct_answer_index")
    private Integer correctAnswerIndex;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Statistics
    @Builder.Default
    @Column(name = "times_used")
    private Long timesUsed = 0L;

    @Builder.Default
    @Column(name = "times_answered_correctly")
    private Long timesAnsweredCorrectly = 0L;

    // Relationships with proper cascade
    @Builder.Default
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionOption> options = new ArrayList<>();

    @Builder.Default
    @ManyToMany(mappedBy = "questions")
    private Set<ExamPackage> packages = new HashSet<>();

    /**
     * Get localized question text
     */
    public String getText(AcceptLanguage language) {
        return switch (language) {
            case UZL -> textUzl;
            case UZC -> textUzc != null ? textUzc : textUzl;
            case EN -> textEn != null ? textEn : textUzl;
            case RU -> textRu != null ? textRu : textUzl;
        };
    }

    /**
     * Get localized explanation
     */
    public String getExplanation(AcceptLanguage language) {
        return switch (language) {
            case UZL -> explanationUzl;
            case UZC -> explanationUzc != null ? explanationUzc : explanationUzl;
            case EN -> explanationEn != null ? explanationEn : explanationUzl;
            case RU -> explanationRu != null ? explanationRu : explanationUzl;
        };
    }

    /**
     * Calculate success rate
     */
    public Double getSuccessRate() {
        if (timesUsed == null || timesUsed == 0) return 0.0;
        return (timesAnsweredCorrectly * 100.0) / timesUsed;
    }

    /**
     * Record answer statistics
     */
    public void recordAnswer(boolean correct) {
        this.timesUsed = (this.timesUsed == null ? 0 : this.timesUsed) + 1;
        if (correct) {
            this.timesAnsweredCorrectly = (this.timesAnsweredCorrectly == null ? 0 : this.timesAnsweredCorrectly) + 1;
        }
    }

    /**
     * Add option with proper bidirectional relationship
     */
    public void addOption(QuestionOption option) {
        options.add(option);
        option.setQuestion(this);
    }

    /**
     * Remove option with proper bidirectional relationship
     */
    public void removeOption(QuestionOption option) {
        options.remove(option);
        option.setQuestion(null);
    }

    /**
     * Override soft delete to update topic statistics
     */
    @Override
    public void softDelete(String deletedBy) {
        super.softDelete(deletedBy);
        if (topic != null) {
            topic.decrementQuestionCount();
        }
    }
}