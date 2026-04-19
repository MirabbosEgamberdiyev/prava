package uz.pravaimtihon.payment.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.pravaimtihon.payment.entity.Payment;
import uz.pravaimtihon.payment.enums.PaymentProvider;
import uz.pravaimtihon.payment.enums.PaymentState;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByMerchantOrderId(String merchantOrderId);

    Optional<Payment> findByProviderAndProviderTransactionId(PaymentProvider provider,
                                                             String providerTransactionId);

    /**
     * Row-level lock — prevents two webhooks racing on same payment.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.provider = :provider and p.providerTransactionId = :txId")
    Optional<Payment> findByProviderTxForUpdate(@Param("provider") PaymentProvider provider,
                                                @Param("txId") String txId);

    @Query("select p from Payment p where p.state = :state and p.createdAt < :before")
    List<Payment> findStaleByState(@Param("state") PaymentState state,
                                   @Param("before") LocalDateTime before);

    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("select p from Payment p where p.user.id = :userId order by p.createdAt desc")
    Page<Payment> findByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
           select p from Payment p
           where (:provider is null or p.provider = :provider)
             and (:state    is null or p.state    = :state)
             and (:userId   is null or p.user.id  = :userId)
           order by p.createdAt desc
           """)
    Page<Payment> search(@Param("provider") PaymentProvider provider,
                         @Param("state") PaymentState state,
                         @Param("userId") Long userId,
                         Pageable pageable);

    @Query("""
           select p from Payment p
           where p.paidAt between :from and :to
             and p.state = uz.pravaimtihon.payment.enums.PaymentState.PERFORMED
           order by p.paidAt asc
           """)
    List<Payment> findPerformedBetween(@Param("from") LocalDateTime from,
                                       @Param("to") LocalDateTime to);

    @Query("""
           select (count(p) > 0) from Payment p
           where p.provider = :provider
             and p.user.id = :userId
             and p.examPackage.id = :packageId
             and p.state = uz.pravaimtihon.payment.enums.PaymentState.CREATED
           """)
    boolean existsActiveCreatedFor(@Param("provider") PaymentProvider provider,
                                   @Param("userId") Long userId,
                                   @Param("packageId") Long packageId);
}
