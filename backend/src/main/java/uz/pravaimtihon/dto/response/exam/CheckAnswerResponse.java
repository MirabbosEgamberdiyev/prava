package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Javob tekshirish natijasi.
 * Frontend uchun tezkor feedback.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CheckAnswerResponse {

    private Long questionId;

    /**
     * Tanlangan variant to'g'rimi?
     */
    private Boolean isCorrect;

    /**
     * To'g'ri variant indeksi
     */
    private Integer correctOptionIndex;

    /**
     * Tushuntirish - 4 tilda
     */
    private LocalizedText explanation;
}
