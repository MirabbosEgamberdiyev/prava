package uz.pravaimtihon.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.TimeZone;

/**
 * Jackson konfiguratsiyasi.
 *
 * Muammo: LocalDateTime timezone ma'lumoti saqlamaydi. Agar Jackson "2024-01-15T10:30:00"
 * (Z-siz) chiqarsa, JavaScript new Date("2024-01-15T10:30:00") uni LOCAL vaqt deb tushunadi —
 * lekin foydalanuvchi turli timezone'da bo'lishi mumkin → noto'g'ri vaqt ko'rinadi.
 *
 * Yechim:
 *   1. JVM TimeZone = UTC  → LocalDateTime.now() har doim UTC qaytaradi
 *   2. Serializatsiya: "2024-01-15T10:30:00Z"  (Z = UTC)
 *   3. JavaScript new Date("2024-01-15T10:30:00Z") UTC deb tushunadi va
 *      foydalanuvchi timezone'iga (masalan UTC+5 Toshkent = 15:30:00) avtomatik aylantiradi
 *   4. Deserializatsiya: "...Z" va "..." ikkalasini ham qabul qiladi
 */
@Configuration
public class JacksonConfig {

    /** Chiqish formati: "2024-01-15T10:30:00Z" */
    private static final DateTimeFormatter UTC_SERIALIZER_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");

    /**
     * Kiris formati: "2024-01-15T10:30:00Z" ham, "2024-01-15T10:30:00" ham qabul qilinadi.
     * ISO_LOCAL_DATE_TIME ga optional 'Z' literal qo'shilgan —
     * Z simvoli LocalDateTime qiymatiga ta'sir qilmaydi (endi UTC saqlanadi).
     */
    private static final DateTimeFormatter FLEXIBLE_DESER_FMT =
            new DateTimeFormatterBuilder()
                    .append(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    .optionalStart().appendLiteral('Z').optionalEnd()
                    .toFormatter();

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        javaTimeModule.addSerializer(LocalDateTime.class,
                new LocalDateTimeSerializer(UTC_SERIALIZER_FMT));
        javaTimeModule.addDeserializer(LocalDateTime.class,
                new LocalDateTimeDeserializer(FLEXIBLE_DESER_FMT));

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(javaTimeModule);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // java.util.Date / Calendar tiplar uchun ham UTC
        mapper.setTimeZone(TimeZone.getTimeZone("UTC"));
        return mapper;
    }
}