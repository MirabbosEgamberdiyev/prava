package uz.pravaimtihon.octagon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "octagon_reports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OctagonReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "match_id")
    private String matchId;

    @Column(name = "reporter_id", nullable = false)
    private String reporterId;

    @Column(name = "reported_user_id", nullable = false)
    private String reportedUserId;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
