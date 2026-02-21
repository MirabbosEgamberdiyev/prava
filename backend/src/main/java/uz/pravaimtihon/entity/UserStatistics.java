package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_statistics", indexes = {
        @Index(name = "idx_stats_user", columnList = "user_id"),
        @Index(name = "idx_stats_topic", columnList = "topic")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "topic"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatistics extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String topic;

    @Column(name = "total_exams")
    @Builder.Default
    private Integer totalExams = 0;

    @Column(name = "passed_exams")
    @Builder.Default
    private Integer passedExams = 0;

    @Column(name = "failed_exams")
    @Builder.Default
    private Integer failedExams = 0;

    @Column(name = "total_questions")
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "correct_answers")
    @Builder.Default
    private Integer correctAnswers = 0;

    @Column(name = "average_score")
    @Builder.Default
    private Double averageScore = 0.0;

    @Column(name = "best_score")
    @Builder.Default
    private Double bestScore = 0.0;

    @Column(name = "current_streak")
    @Builder.Default
    private Integer currentStreak = 0;

    @Column(name = "longest_streak")
    @Builder.Default
    private Integer longestStreak = 0;

    @Column(name = "total_time_spent_seconds")
    @Builder.Default
    private Long totalTimeSpentSeconds = 0L;

    public void updateFromSession(ExamSession session) {
        this.totalExams++;
        this.totalQuestions += session.getTotalQuestions();
        this.correctAnswers += session.getCorrectCount();

        // Average score
        this.averageScore = ((this.averageScore * (totalExams - 1)) +
                session.getPercentage()) / totalExams;

        // Best score
        if (session.getPercentage() > this.bestScore) {
            this.bestScore = session.getPercentage();
        }

        // Pass/fail tracking
        if (session.getIsPassed()) {
            this.passedExams++;
            this.currentStreak++;
            if (this.currentStreak > this.longestStreak) {
                this.longestStreak = this.currentStreak;
            }
        } else {
            this.failedExams++;
            this.currentStreak = 0;
        }

        // Time tracking
        this.totalTimeSpentSeconds += session.getDurationSeconds();
    }

    public Double getSuccessRate() {
        if (totalExams == 0) return 0.0;
        return (passedExams * 100.0) / totalExams;
    }

    public Double getAccuracy() {
        if (totalQuestions == 0) return 0.0;
        return (correctAnswers * 100.0) / totalQuestions;
    }
}