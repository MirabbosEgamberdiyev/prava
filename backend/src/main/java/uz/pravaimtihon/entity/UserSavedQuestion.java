package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Foydalanuvchi saqlagan savollar jadvali.
 * Prava-Desktop-Online uchun.
 */
@Entity
@Table(name = "user_saved_questions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_id"}),
    indexes = {
        @Index(name = "idx_usq_user", columnList = "user_id"),
        @Index(name = "idx_usq_question", columnList = "question_id")
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSavedQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "saved_at", nullable = false)
    @Builder.Default
    private LocalDateTime savedAt = LocalDateTime.now();
}
