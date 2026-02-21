package uz.pravaimtihon.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.entity.VerificationCode;
import uz.pravaimtihon.enums.VerificationType;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
     /**
     * ✅ Find valid code without locking (for display purposes)
     *
     * Used by: sendVerificationCode() - just checking existence
     */
    @Query("""
        SELECT vc FROM VerificationCode vc
        WHERE vc.recipient = :recipient
          AND vc.code = :code
          AND vc.type = :type
          AND vc.expiresAt > :now
          AND vc.isUsed = false
        ORDER BY vc.createdAt DESC
        LIMIT 1
    """)
    Optional<VerificationCode> findValidCode(
            @Param("recipient") String recipient,
            @Param("code") String code,
            @Param("type") VerificationType type,
            @Param("now") LocalDateTime now
    );

    /**
     * ✅ NEW: Find valid code WITH pessimistic lock (thread-safe)
     *
     * Used by: verifyCode() - prevents race conditions
     *
     * This query will:
     * 1. Lock the row in database (other transactions wait)
     * 2. Ensure atomic read-modify-write operations
     * 3. Prevent concurrent verification attempts
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT vc FROM VerificationCode vc
        WHERE vc.recipient = :recipient
          AND vc.type = :type
          AND vc.expiresAt > :now
          AND vc.isUsed = false
        ORDER BY vc.createdAt DESC
        LIMIT 1
    """)
    Optional<VerificationCode> findValidCodeWithLock(
            @Param("recipient") String recipient,
            @Param("type") VerificationType type,
            @Param("now") LocalDateTime now
    );

    /**
     * ✅ Count recent codes for rate limiting
     *
     * Checks how many codes were sent to this recipient in the last hour
     */
    @Query("""
        SELECT COUNT(vc) FROM VerificationCode vc
        WHERE vc.recipient = :recipient
          AND vc.type = :type
          AND vc.createdAt > :since
    """)
    long countRecentCodes(
            @Param("recipient") String recipient,
            @Param("type") VerificationType type,
            @Param("since") LocalDateTime since
    );

    /**
     * ✅ Delete expired codes (cleanup job)
     *
     * Returns: Number of deleted records
     */
    @Modifying
    @Query("""
        DELETE FROM VerificationCode vc
        WHERE vc.expiresAt < :cutoffDate
           OR (vc.isUsed = true AND vc.createdAt < :cutoffDate)
    """)
    int deleteExpiredCodes(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * ✅ Find latest code for recipient (for debugging)
     */
    @Query("""
        SELECT vc FROM VerificationCode vc
        WHERE vc.recipient = :recipient
          AND vc.type = :type
        ORDER BY vc.createdAt DESC
        LIMIT 1
    """)
    Optional<VerificationCode> findLatestCode(
            @Param("recipient") String recipient,
            @Param("type") VerificationType type
    );
}

