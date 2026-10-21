package uz.pravaimtihon.octagon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.octagon.enums.OctagonChallengeStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "octagon_challenges", indexes = {
        @Index(name = "idx_octagon_challenges_code", columnList = "invite_code", unique = true),
        @Index(name = "idx_octagon_challenges_status", columnList = "status"),
        @Index(name = "idx_octagon_challenges_challenger", columnList = "challenger_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OctagonChallenge {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "challenger_id", length = 64, nullable = false)
    private String challengerId;

    @Column(name = "target_user_id", length = 64)
    private String targetUserId;

    @Column(name = "invite_code", length = 32, nullable = false, unique = true)
    private String inviteCode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private OctagonChallengeStatus status = OctagonChallengeStatus.PENDING;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
