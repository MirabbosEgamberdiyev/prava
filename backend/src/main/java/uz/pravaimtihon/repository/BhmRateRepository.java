package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.pravaimtihon.entity.BhmRate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BhmRateRepository extends JpaRepository<BhmRate, Long> {

    /** Joriy BHM: kuchga kirgan eng so'nggi qiymat. */
    Optional<BhmRate> findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDescIdDesc(LocalDate date);

    List<BhmRate> findAllByOrderByEffectiveFromDescIdDesc();
}
