package uz.pravaimtihon.octagon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.octagon.entity.OctagonChallenge;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OctagonChallengeRepository extends JpaRepository<OctagonChallenge, UUID> {

    Optional<OctagonChallenge> findByInviteCode(String inviteCode);
}
