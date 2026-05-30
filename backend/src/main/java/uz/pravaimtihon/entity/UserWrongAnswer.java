package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Foydalanuvchi xato qilgan savollar jadvali.
 * Prava-Desktop-Online uchun.
 */
@Entity
@Table(name = "user_wrong_answers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_id"}),
    indexes = {
        @Index(name = "idx_uwa_user", columnList = "user_id"),
        @Index(name = "idx_uwa_question", columnList = "question_id")
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserWrongAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "wrong_count", nullable = false)
    @Builder.Default
    private Integer wrongCount = 1;

    @Column(name = "last_seen", nullable = false)
    @Builder.Default
    private LocalDateTime lastSeen = LocalDateTime.now();
}
