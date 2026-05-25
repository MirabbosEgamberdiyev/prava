package uz.pravaimtihon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
public class PravaImtihonApplication {

    public static void main(String[] args) {
        // JVM ni UTC ga majburlash — LocalDateTime.now() har doim UTC qaytarsin.
        // Shu bilan server qaysi timezone'da bo'lmasin, barcha sana/vaqt UTC saqlanadi.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

        SpringApplication.run(PravaImtihonApplication.class, args);
    }
}
