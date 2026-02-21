package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Bilet response - bilet ma'lumotlari.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketResponse {

    private Long id;

    /**
     * Bilet raqami
     */
    private Integer ticketNumber;

    /**
     * Bilet nomi (4 tilda)
     */
    private LocalizedText name;

    /**
     * Bilet tavsifi (4 tilda)
     */
    private LocalizedText description;

    /**
     * Paket ID (agar mavjud)
     */
    private Long packageId;

    /**
     * Paket nomi (4 tilda)
     */
    private LocalizedText packageName;

    /**
     * Mavzu ID (agar mavjud)
     */
    private Long topicId;

    /**
     * Mavzu nomi (4 tilda)
     */
    private LocalizedText topicName;

    /**
     * Savollar soni
     */
    private Integer questionCount;

    /**
     * Test davomiyligi (daqiqa)
     */
    private Integer durationMinutes;

    /**
     * O'tish bali (foiz)
     */
    private Integer passingScore;

    /**
     * Faol holati
     */
    private Boolean isActive;

    /**
     * Savollar (test boshlanganda)
     */
    private List<QuestionResponse> questions;
}
