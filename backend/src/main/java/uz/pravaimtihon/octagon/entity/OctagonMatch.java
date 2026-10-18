package uz.pravaimtihon.octagon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonMatchStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "octagon_matches", indexes = {
        @Index(name = "idx_octagon_matches_created_at", columnList = "created_at"),
        @Index(name = "idx_octagon_matches_p1", columnList = "player1_id"),
        @Index(name = "idx_octagon_matches_p2", columnList = "player2_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OctagonMatch {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "player1_id", length = 64, nullable = false)
    private String player1Id;

    @Column(name = "player2_id", length = 64, nullable = false)
    private String player2Id;

    @Builder.Default
    @Column(name = "player1_score", nullable = false)
    private Integer player1Score = 0;

    @Builder.Default
    @Column(name = "player2_score", nullable = false)
    private Integer player2Score = 0;

    @Column(name = "winner_id", length = 64)
    private String winnerId;

    @Builder.Default
    @Column(name = "is_draw", nullable = false)
    private Boolean isDraw = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "game_type", length = 32, nullable = false)
    private OctagonGameType gameType = OctagonGameType.RANKED_QUEUE;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private OctagonMatchStatus status = OctagonMatchStatus.ONGOING;

    @Column(name = "question_ids", columnDefinition = "TEXT", nullable = false)
    private String questionIds;

    @Builder.Default
    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds = 0;

    @Builder.Default
    @Column(name = "p1_elo_change", nullable = false)
    private Integer p1EloChange = 0;

    @Builder.Default
    @Column(name = "p2_elo_change", nullable = false)
    private Integer p2EloChange = 0;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
