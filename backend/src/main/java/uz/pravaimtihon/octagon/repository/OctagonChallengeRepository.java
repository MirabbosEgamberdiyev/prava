package uz.pravaimtihon.octagon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.octagon.entity.OctagonChallenge;
import uz.pravaimtihon.octagon.enums.OctagonChallengeStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OctagonChallengeRepository extends JpaRepository<OctagonChallenge, UUID> {

    /** 4 xonali kodlar qayta ishlatiladi — faqat shu holatdagi eng yangi taklif olinadi. */
    Optional<OctagonChallenge> findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(String inviteCode, OctagonChallengeStatus status);

    List<OctagonChallenge> findByChallengerIdAndStatus(String challengerId, OctagonChallengeStatus status);

    @Modifying
    @Query("UPDATE OctagonChallenge c SET c.status = :expired WHERE c.status = :pending AND c.expiresAt < :now")
    int expirePendingBefore(@Param("now") LocalDateTime now,
                            @Param("pending") OctagonChallengeStatus pending,
                            @Param("expired") OctagonChallengeStatus expired);
}
