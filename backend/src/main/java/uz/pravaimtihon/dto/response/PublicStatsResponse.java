package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Autentifikatsiyasiz ochiq umumiy statistika javob modeli.
 * Barcha sonlar haqiqiy (o'chirilgan va nofaol yozuvlarsiz).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicStatsResponse {
    private Long totalQuestions;
    private Long totalPackages;
    private Long totalTopics;
    /** Faol biletlar soni (web bosh sahifasi {@code totalTickets} ni o'qiydi). */
    private Long totalTickets;
    /**
     * @deprecated avval soxta (50000) qiymat edi; endi to'ldirilmaydi va javobda chiqmaydi.
     */
    @Deprecated
    private Long activeUsers;
}
