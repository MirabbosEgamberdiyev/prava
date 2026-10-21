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

    /** Foydalanuvchidan oldinda turganlar soni (o'rni = shu son + 1), jadval tartibi bilan bir xil. */
    @Query("SELECT COUNT(p) FROM OctagonProfile p WHERE p.userId NOT LIKE 'guest\\_%' ESCAPE '\\' AND p.userId NOT LIKE 'bot%' " +
            "AND (p.eloRating > :elo OR (p.eloRating = :elo AND p.wins > :wins))")
    long countAhead(@org.springframework.data.repository.query.Param("elo") int elo,
                    @org.springframework.data.repository.query.Param("wins") int wins);

    @Query("SELECT COUNT(p) FROM OctagonProfile p WHERE p.updatedAt >= :since " +
            "AND p.userId NOT LIKE 'guest\\_%' ESCAPE '\\' AND p.userId NOT LIKE 'bot%' " +
            "AND (p.eloRating > :elo OR (p.eloRating = :elo AND p.wins > :wins))")
    long countAheadSince(@org.springframework.data.repository.query.Param("since") LocalDateTime since,
                         @org.springframework.data.repository.query.Param("elo") int elo,
                         @org.springframework.data.repository.query.Param("wins") int wins);
}
