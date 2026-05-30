package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.UserWrongAnswer;

import java.util.List;
import java.util.Optional;

public interface UserWrongAnswerRepository extends JpaRepository<UserWrongAnswer, Long> {

    List<UserWrongAnswer> findByUserIdOrderByLastSeenDesc(Long userId);

    Optional<UserWrongAnswer> findByUserIdAndQuestionId(Long userId, Long questionId);

    boolean existsByUserIdAndQuestionId(Long userId, Long questionId);

    @Modifying
    @Query("DELETE FROM UserWrongAnswer w WHERE w.user.id = :userId AND w.question.id = :questionId")
    void deleteByUserIdAndQuestionId(@Param("userId") Long userId, @Param("questionId") Long questionId);

    @Modifying
    @Query("DELETE FROM UserWrongAnswer w WHERE w.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
