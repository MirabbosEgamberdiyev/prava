package uz.pravaimtihon.repository;
import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.UserStatistics;

import java.util.List;
import java.util.Optional;

public interface UserStatisticsRepository extends JpaRepository<UserStatistics, Long> {

    Optional<UserStatistics> findByUserIdAndTopic(Long userId, String topic);

    List<UserStatistics> findByUserId(Long userId);

    @Query("SELECT us FROM UserStatistics us WHERE us.topic = :topic " +
            "ORDER BY us.bestScore DESC, us.averageScore DESC")
    List<UserStatistics> findLeaderboardByTopic(@Param("topic") String topic,
                                                Pageable pageable);

    @Query("SELECT us FROM UserStatistics us " +
            "ORDER BY us.totalExams DESC, us.bestScore DESC")
    List<UserStatistics> findGlobalLeaderboard(Pageable pageable);

    // ⚠️ FIX — N+1: `us.user` is FetchType.LAZY. Without a fetch join here,
    // `stats.getUser().getFullName()` in StatisticsService triggers one extra
    // SELECT per row (20 rows/page = 21 queries total). `LEFT JOIN FETCH`
    // batches the User rows into the same query. An explicit `countQuery` is
    // required because Hibernate cannot safely derive a COUNT query from a
    // JOIN FETCH + Pageable combination.
    @Query(value = "SELECT us FROM UserStatistics us LEFT JOIN FETCH us.user " +
            "WHERE us.topic = :topic " +
            "ORDER BY us.bestScore DESC, us.averageScore DESC",
            countQuery = "SELECT COUNT(us) FROM UserStatistics us WHERE us.topic = :topic")
    Page<UserStatistics> findLeaderboardByTopicPaginated(@Param("topic") String topic, Pageable pageable);

    @Query(value = "SELECT us FROM UserStatistics us LEFT JOIN FETCH us.user " +
            "ORDER BY us.bestScore DESC, us.averageScore DESC, us.totalExams DESC",
            countQuery = "SELECT COUNT(us) FROM UserStatistics us")
    Page<UserStatistics> findGlobalLeaderboardPaginated(Pageable pageable);

}