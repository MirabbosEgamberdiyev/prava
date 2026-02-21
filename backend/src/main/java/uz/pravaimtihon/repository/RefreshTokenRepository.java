package uz.pravaimtihon.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.RefreshToken;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    // ✅ FIXED: Proper method name
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token " +
            "AND rt.isRevoked = false AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidToken(@Param("token") String token,
                                          @Param("now") LocalDateTime now);

    List<RefreshToken> findByUserIdAndIsRevokedFalse(Long userId);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :now " +
            "WHERE rt.user.id = :userId AND rt.isRevoked = false")
    void revokeAllByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :now " +
            "WHERE rt.tokenFamily = :family AND rt.isRevoked = false")
    void revokeAllByFamily(@Param("family") String family, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :date OR " +
            "(rt.isRevoked = true AND rt.revokedAt < :date)")
    void deleteExpiredTokens(@Param("date") LocalDateTime date);

    /**
     * Check if a revoked token exists in a given family (token reuse detection).
     */
    @Query("SELECT CASE WHEN COUNT(rt) > 0 THEN true ELSE false END FROM RefreshToken rt " +
            "WHERE rt.token = :token AND rt.isRevoked = true")
    boolean isTokenRevoked(@Param("token") String token);

    /**
     * Inactive sessions cleanup: revoke tokens not used for N days.
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true, rt.revokedAt = :now " +
            "WHERE rt.isRevoked = false AND rt.lastUsedAt IS NOT NULL AND rt.lastUsedAt < :cutoff")
    void revokeInactiveTokens(@Param("now") LocalDateTime now, @Param("cutoff") LocalDateTime cutoff);

    // ============================================
    // Device Management Methods
    // ============================================

    /**
     * Faol tokenlar sonini hisoblash.
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt " +
            "WHERE rt.user.id = :userId AND rt.isRevoked = false AND rt.expiresAt > :now")
    int countActiveTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Eng eski faol tokenlarni olish (Pageable orqali limit).
     */
    @Query("SELECT rt FROM RefreshToken rt " +
            "WHERE rt.user.id = :userId AND rt.isRevoked = false AND rt.expiresAt > :now " +
            "ORDER BY rt.createdAt ASC")
    List<RefreshToken> findOldestActiveTokensByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    /**
     * Foydalanuvchining barcha tokenlarini o'chirish.
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    /**
     * Foydalanuvchining faol tokenlari ro'yxati.
     */
    @Query("SELECT rt FROM RefreshToken rt " +
            "WHERE rt.user.id = :userId AND rt.isRevoked = false AND rt.expiresAt > :now " +
            "ORDER BY rt.createdAt DESC")
    List<RefreshToken> findActiveTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
