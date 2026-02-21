package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ✅ ExamSession - Active or completed exam instance
 */
@Entity
@Table(name = "exam_sessions", indexes = {
        @Index(name = "idx_session_user", columnList = "user_id"),
        @Index(name = "idx_session_package", columnList = "package_id"),
        @Index(name = "idx_session_status", columnList = "status"),
        @Index(name = "idx_session_started", columnList = "started_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = true)  // Nullable for marathon mode
    private ExamPackage examPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = true)  // Nullable - only for ticket mode
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExamStatus status = ExamStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AcceptLanguage language;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "answered_count")
    @Builder.Default
    private Integer answeredCount = 0;

    @Column(name = "correct_count")
    @Builder.Default
    private Integer correctCount = 0;

    @Column(name = "wrong_count")
    @Builder.Default
    private Integer wrongCount = 0;

    @Column(name = "score")
    @Builder.Default
    private Integer score = 0;

    @Column(name = "percentage")
    @Builder.Default
    private Double percentage = 0.0;

    @Column(name = "is_passed")
    @Builder.Default
    private Boolean isPassed = false;

    @Column(name = "last_saved_at")
    private LocalDateTime lastSavedAt;

    // ✅ FIXED: Proper cascade and fetch settings
    @OneToMany(mappedBy = "examSession", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    @Builder.Default
    private List<ExamAnswer> answers = new ArrayList<>();

    // ============================================
    // Business Logic Methods
    // ============================================

    /**
     * Start the exam session
     */
    public void start() {
        this.status = ExamStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
        this.expiresAt = startedAt.plusMinutes(durationMinutes);
    }

    /**
     * Finish the exam session
     */
    public void finish() {
        this.status = ExamStatus.COMPLETED;
        this.finishedAt = LocalDateTime.now();
        calculateResults();
    }

    /**
     * Expire the exam session
     */
    public void expire() {
        this.status = ExamStatus.EXPIRED;
        this.finishedAt = LocalDateTime.now();
        calculateResults();
    }

    /**
     * Abandon the exam session
     */
    public void abandon() {
        this.status = ExamStatus.ABANDONED;
        this.finishedAt = LocalDateTime.now();
    }

    /**
     * Check if exam is expired
     */
    public boolean isExpired() {
        if (status == ExamStatus.COMPLETED || status == ExamStatus.EXPIRED) {
            return true;
        }
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if exam is active
     */
    public boolean isActive() {
        return status == ExamStatus.IN_PROGRESS && !isExpired();
    }

    /**
     * Get duration in seconds
     */
    public Long getDurationSeconds() {
        if (startedAt == null || finishedAt == null) {
            return 0L;
        }
        return Duration.between(startedAt, finishedAt).getSeconds();
    }

    /**
     * ✅ FIXED: Add answer to session
     */
    public void addAnswer(ExamAnswer answer) {
        if (this.answers == null) {
            this.answers = new ArrayList<>();
        }
        this.answers.add(answer);
        answer.setExamSession(this);
    }

    /**
     * Calculate exam results
     */
    private void calculateResults() {
        if (answers == null || answers.isEmpty()) {
            return;
        }

        this.answeredCount = (int) answers.stream()
                .filter(a -> a.getSelectedOptionIndex() != null)
                .count();

        this.correctCount = (int) answers.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .count();

        this.wrongCount = answeredCount - correctCount;

        if (totalQuestions > 0) {
            this.percentage = (correctCount * 100.0) / totalQuestions;
            this.score = correctCount;
            // Handle null examPackage (marathon mode) - default passing score is 70%
            int passingScore = examPackage != null ? examPackage.getPassingScore() : 70;
            this.isPassed = percentage >= passingScore;
        }
    }

    /**
     * Check if this is a marathon mode session (no package and no ticket)
     */
    public boolean isMarathonMode() {
        return examPackage == null && ticket == null;
    }

    /**
     * Check if this is a ticket mode session
     */
    public boolean isTicketMode() {
        return ticket != null;
    }

    /**
     * Check if this is a package mode session
     */
    public boolean isPackageMode() {
        return examPackage != null && ticket == null;
    }
}