package uz.pravaimtihon.payment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.payment.entity.UserPackageAccess;

import java.util.List;
import java.util.Optional;

public interface UserPackageAccessRepository extends JpaRepository<UserPackageAccess, Long> {

    @Query("""
           select a from UserPackageAccess a
           where a.user.id = :userId and a.examPackage.id = :packageId
           """)
    Optional<UserPackageAccess> findByUserIdAndPackageId(@Param("userId") Long userId,
                                                        @Param("packageId") Long packageId);

    @Query("""
           select (count(a) > 0) from UserPackageAccess a
           where a.user.id = :userId
             and a.examPackage.id = :packageId
             and a.revoked = false
             and (a.expiresAt is null or a.expiresAt > CURRENT_TIMESTAMP)
           """)
    boolean hasActiveAccess(@Param("userId") Long userId,
                            @Param("packageId") Long packageId);

    @Query("select a from UserPackageAccess a where a.user.id = :userId")
    List<UserPackageAccess> findAllByUserId(@Param("userId") Long userId);

    @Query("select a from UserPackageAccess a where a.payment.id = :paymentId")
    Optional<UserPackageAccess> findByPaymentId(@Param("paymentId") Long paymentId);
}
