package uz.pravaimtihon.octagon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.octagon.entity.OctagonMatch;

import java.util.UUID;

@Repository
public interface OctagonMatchRepository extends JpaRepository<OctagonMatch, UUID> {

    @Query("SELECT m FROM OctagonMatch m WHERE m.player1Id = :userId OR m.player2Id = :userId ORDER BY m.createdAt DESC")
    Page<OctagonMatch> findUserMatches(@Param("userId") String userId, Pageable pageable);
}
