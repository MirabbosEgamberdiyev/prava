package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.ArrayList;
import java.util.List;

/**
 * Bilet entity - moslashuvchan savollar soniga ega test birligi.
 * Minimal 10 ta savol, default 10, lekin 15, 20, 25 va hokazo bo'lishi mumkin.
 * Bilet Package va Topic bilan bog'lanadi.
 *
 * Struktura: Topic → Questions → Ticket → Package
 */
@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "idx_ticket_package", columnList = "package_id"),
        @Index(name = "idx_ticket_topic", columnList = "topic_id"),
        @Index(name = "idx_ticket_active", columnList = "is_active"),
        @Index(name = "idx_ticket_number", columnList = "ticket_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket extends BaseEntity {

    /**
     * Bilet raqami (1, 2, 3, ...)
     */
    @Column(name = "ticket_number", nullable = false)
    private Integer ticketNumber;

    /**
     * Bilet nomi (UZL)
     */
    @Column(name = "name_uzl", length = 200)
    private String nameUzl;

    /**
     * Bilet nomi (UZC)
     */
    @Column(name = "name_uzc", length = 200)
    private String nameUzc;

    /**
     * Bilet nomi (EN)
     */
    @Column(name = "name_en", length = 200)
    private String nameEn;

    /**
     * Bilet nomi (RU)
     */
    @Column(name = "name_ru", length = 200)
    private String nameRu;

    /**
     * Bilet tavsifi (UZL)
     */
    @Column(name = "description_uzl", length = 1000)
    private String descriptionUzl;

    /**
     * Bilet tavsifi (UZC)
     */
    @Column(name = "description_uzc", length = 1000)
    private String descriptionUzc;

    /**
     * Bilet tavsifi (EN)
     */
    @Column(name = "description_en", length = 1000)
    private String descriptionEn;

    /**
     * Bilet tavsifi (RU)
     */
    @Column(name = "description_ru", length = 1000)
    private String descriptionRu;

    /**
     * Paket (ixtiyoriy)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = true)
    private ExamPackage examPackage;

    /**
     * Mavzu (ixtiyoriy)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = true)
    private Topic topic;

    /**
     * Biletdagi savollar (aniq 10 ta)
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "ticket_questions",
            joinColumns = @JoinColumn(name = "ticket_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    @OrderColumn(name = "question_order")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    /**
     * Test davomiyligi (daqiqa) - default 15
     */
    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 15;

    /**
     * O'tish bali (foiz) - default 70
     */
    @Column(name = "passing_score", nullable = false)
    @Builder.Default
    private Integer passingScore = 70;

    /**
     * Faol holati
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Biletdagi savollar soni (moslashuvchan: 10, 15, 20, ...)
     * Default: 10, Minimal: 10
     */
    @Column(name = "question_count", nullable = false)
    @Builder.Default
    private Integer targetQuestionCount = 10;

    /**
     * Minimal savollar soni
     */
    public static final int MIN_QUESTIONS_PER_TICKET = 10;

    /**
     * Default savollar soni
     */
    public static final int DEFAULT_QUESTIONS_PER_TICKET = 10;

    // ============================================
    // Multi-language support
    // ============================================

    public String getName(AcceptLanguage language) {
        if (language == null) return nameUzl;
        return switch (language) {
            case UZL -> nameUzl != null ? nameUzl : nameEn;
            case UZC -> nameUzc != null ? nameUzc : nameUzl;
            case EN -> nameEn != null ? nameEn : nameUzl;
            case RU -> nameRu != null ? nameRu : nameUzl;
        };
    }

    public String getDescription(AcceptLanguage language) {
        if (language == null) return descriptionUzl;
        return switch (language) {
            case UZL -> descriptionUzl != null ? descriptionUzl : descriptionEn;
            case UZC -> descriptionUzc != null ? descriptionUzc : descriptionUzl;
            case EN -> descriptionEn != null ? descriptionEn : descriptionUzl;
            case RU -> descriptionRu != null ? descriptionRu : descriptionUzl;
        };
    }

    // ============================================
    // Business Logic
    // ============================================

    /**
     * Biletda yetarli savollar bormi?
     * Savollar soni targetQuestionCount ga teng yoki ko'p bo'lishi kerak
     */
    public boolean hasEnoughQuestions() {
        return questions != null && questions.size() >= getEffectiveQuestionCount();
    }

    /**
     * Savollar soni yetarlimi? (aniq son bilan tekshirish)
     */
    public boolean hasExactQuestionCount() {
        return questions != null && questions.size() == getEffectiveQuestionCount();
    }

    /**
     * Haqiqiy savollar sonini olish (joriy)
     */
    public int getQuestionCount() {
        return questions != null ? questions.size() : 0;
    }

    /**
     * Target savollar sonini olish (minimal MIN_QUESTIONS_PER_TICKET)
     */
    public int getEffectiveQuestionCount() {
        return targetQuestionCount != null && targetQuestionCount >= MIN_QUESTIONS_PER_TICKET
                ? targetQuestionCount
                : DEFAULT_QUESTIONS_PER_TICKET;
    }

    /**
     * Savol qo'shish
     */
    public void addQuestion(Question question) {
        if (questions == null) {
            questions = new ArrayList<>();
        }
        if (!questions.contains(question)) {
            questions.add(question);
        }
    }

    /**
     * Savol olib tashlash
     */
    public void removeQuestion(Question question) {
        if (questions != null) {
            questions.remove(question);
        }
    }

    /**
     * Target savol sonini o'rnatish (minimal 10)
     */
    public void setTargetQuestionCount(Integer count) {
        if (count != null && count >= MIN_QUESTIONS_PER_TICKET) {
            this.targetQuestionCount = count;
        } else {
            this.targetQuestionCount = DEFAULT_QUESTIONS_PER_TICKET;
        }
    }

    /**
     * Default nom yaratish
     */
    public static String generateDefaultName(int ticketNumber, AcceptLanguage language) {
        return switch (language) {
            case UZL -> "Bilet #" + ticketNumber;
            case UZC -> "Билет #" + ticketNumber;
            case EN -> "Ticket #" + ticketNumber;
            case RU -> "Билет #" + ticketNumber;
        };
    }
}
