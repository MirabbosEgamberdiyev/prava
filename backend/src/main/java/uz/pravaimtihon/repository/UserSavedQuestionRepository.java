package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.UserSavedQuestion;

import java.util.List;
import java.util.Optional;

public interface UserSavedQuestionRepository extends JpaRepository<UserSavedQuestion, Long> {

    List<UserSavedQuestion> findByUserIdOrderBySavedAtDesc(Long userId);

    Optional<UserSavedQuestion> findByUserIdAndQuestionId(Long userId, Long questionId);

    boolean existsByUserIdAndQuestionId(Long userId, Long questionId);

    @Modifying
    @Query("DELETE FROM UserSavedQuestion s WHERE s.user.id = :userId AND s.question.id = :questionId")
    void deleteByUserIdAndQuestionId(@Param("userId") Long userId, @Param("questionId") Long questionId);

    @Modifying
    @Query("DELETE FROM UserSavedQuestion s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
