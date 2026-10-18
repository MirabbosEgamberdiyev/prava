package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kontent manifesti DTO: Markaziy PostgreSQL bazasining joriy holati.
 * Platformalar (Web, Desktop, Mobile) versiya va sonlarni ETag orqali solishtirish uchun ishlatadi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentManifestResponse {
    private String version;
    private Integer schemaVersion;
    private Long totalQuestions;
    private Long totalTickets;
    private Long totalTopics;
    private Long totalTicketQuestions;
    private Instant lastUpdatedAt;
    private String checksum;
}
