package uz.pravaimtihon.octagon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.octagon.enums.OctagonRank;

import java.time.LocalDateTime;

@Entity
@Table(name = "octagon_profiles", indexes = {
        @Index(name = "idx_octagon_profiles_elo", columnList = "elo_rating"),
        @Index(name = "idx_octagon_profiles_rank", columnList = "rank")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OctagonProfile {

    @Id
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;

    @Builder.Default
    @Column(name = "elo_rating", nullable = false)
    private Integer eloRating = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "rank", length = 32, nullable = false)
    private OctagonRank rank = OctagonRank.BRONZE;

    @Builder.Default
    @Column(name = "wins", nullable = false)
    private Integer wins = 0;

    @Builder.Default
    @Column(name = "losses", nullable = false)
    private Integer losses = 0;

    @Builder.Default
    @Column(name = "draws", nullable = false)
    private Integer draws = 0;

    @Builder.Default
    @Column(name = "win_streak", nullable = false)
    private Integer winStreak = 0;

    @Builder.Default
    @Column(name = "max_win_streak", nullable = false)
    private Integer maxWinStreak = 0;

    @Builder.Default
    @Column(name = "total_matches", nullable = false)
    private Integer totalMatches = 0;

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
