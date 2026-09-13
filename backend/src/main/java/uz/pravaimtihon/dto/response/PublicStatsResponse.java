package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Autentifikatsiyasiz ochiq umumiy statistika javob modeli
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicStatsResponse {
    private Long totalQuestions;
    private Long totalPackages;
    private Long totalTopics;
    private Long activeUsers;
}
