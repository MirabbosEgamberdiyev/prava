package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.pravaimtihon.entity.TrafficFine;

import java.util.List;

public interface TrafficFineRepository extends JpaRepository<TrafficFine, Long> {

    List<TrafficFine> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<TrafficFine> findAllByOrderBySortOrderAscIdAsc();
}
