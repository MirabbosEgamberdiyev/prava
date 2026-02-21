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

    @Query("SELECT us FROM UserStatistics us " +
            "WHERE us.topic = :topic " +
            "ORDER BY us.bestScore DESC, us.averageScore DESC")
    Page<UserStatistics> findLeaderboardByTopicPaginated(@Param("topic") String topic, Pageable pageable);

    @Query("SELECT us FROM UserStatistics us " +
            "ORDER BY us.bestScore DESC, us.averageScore DESC, us.totalExams DESC")
    Page<UserStatistics> findGlobalLeaderboardPaginated(Pageable pageable);

}