package uz.pravaimtihon.octagon.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.octagon.entity.OctagonProfile;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OctagonProfileRepository extends JpaRepository<OctagonProfile, String> {

    // Mehmon (guest_*) va bot (bot*) profillari reytingga kirmaydi.
    @Query("SELECT p FROM OctagonProfile p WHERE p.userId NOT LIKE 'guest\\_%' ESCAPE '\\' AND p.userId NOT LIKE 'bot%' " +
            "ORDER BY p.eloRating DESC, p.wins DESC")
    List<OctagonProfile> findTopLeaderboard(Pageable pageable);

    @Query("SELECT p FROM OctagonProfile p WHERE p.updatedAt >= :since " +
            "AND p.userId NOT LIKE 'guest\\_%' ESCAPE '\\' AND p.userId NOT LIKE 'bot%' " +
            "ORDER BY p.eloRating DESC, p.wins DESC")
    List<OctagonProfile> findTopLeaderboardSince(LocalDateTime since, Pageable pageable);
}
