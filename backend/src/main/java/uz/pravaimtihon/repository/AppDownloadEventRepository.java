package uz.pravaimtihon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.AppDownloadEvent;

import java.time.LocalDateTime;

@Repository
public interface AppDownloadEventRepository extends JpaRepository<AppDownloadEvent, Long> {

    long countByPlatform(String platform);

    @Query("SELECT COUNT(DISTINCT a.clientIp) FROM AppDownloadEvent a WHERE a.platform = :platform")
    long countUniqueUsersByPlatform(@Param("platform") String platform);

    @Query("SELECT MAX(a.downloadedAt) FROM AppDownloadEvent a WHERE a.platform = :platform")
    LocalDateTime findLastDownloadTimeByPlatform(@Param("platform") String platform);
}
