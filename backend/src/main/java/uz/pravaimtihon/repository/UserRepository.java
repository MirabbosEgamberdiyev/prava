package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;  // ← ADD THIS
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.Role;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {  // ← ADD THIS

    Optional<User> findByPhoneNumberAndDeletedFalse(String phoneNumber);

    Optional<User> findByEmailAndDeletedFalse(String email);

    @Query("SELECT u FROM User u WHERE u.deleted = false AND " +
            "(u.phoneNumber = :identifier OR u.email = :identifier " +
            "OR u.telegramId = :identifier OR u.googleId = :identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);
    Optional<User> findByGoogleIdAndDeletedFalse(String googleId);

    Optional<User> findByTelegramIdAndDeletedFalse(String telegramId);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);

    Page<User> findByDeletedFalseAndIsActiveTrue(Pageable pageable);

    Page<User> findByDeletedFalseAndRoleAndIsActiveTrue(Role role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.deleted = false AND u.isActive = true " +
            "AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR u.phoneNumber LIKE CONCAT('%', :search, '%') " +
            "OR u.email LIKE CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false AND u.isActive = true")
    long countActiveUsers();

    @Query("SELECT u FROM User u WHERE u.accountLockedUntil IS NOT NULL " +
            "AND u.accountLockedUntil < :now")
    List<User> findLockedAccountsToUnlock(@Param("now") LocalDateTime now);

    /**
     * Global device limit o'rnatish (faqat customized=false bo'lganlar uchun).
     */
    @Modifying
    @Query("UPDATE User u SET u.maxDevices = :maxDevices " +
            "WHERE u.deleted = false AND (u.deviceLimitCustomized = false OR u.deviceLimitCustomized IS NULL)")
    int updateGlobalDeviceLimit(@Param("maxDevices") Integer maxDevices);

    /**
     * Customized bo'lmagan userlar sonini olish.
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false " +
            "AND (u.deviceLimitCustomized = false OR u.deviceLimitCustomized IS NULL)")
    long countNonCustomizedUsers();

    /**
     * Customized bo'lgan userlar sonini olish.
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.deleted = false AND u.deviceLimitCustomized = true")
    long countCustomizedUsers();
}